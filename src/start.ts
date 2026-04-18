import cors from 'cors';
import path from "path";
import helmet from 'helmet';
import express from 'express';
import { exit } from 'process';
import mongoose from 'mongoose';
import * as bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';

import config from './config/app-config';

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { swaggerDefinition } from './swagger/swagger-config';

import LoggerService from 'shared/services/logger-service';
import AuthController from 'auth/controllers/auth-controller';
import RoleController from 'user/controllers/role-controller';
import SyncController from 'sync/controllers/sync-controller';
import UserController from 'user/controllers/user-controller';
import BaseController from 'shared/controllers/base-controller';
import CityController from 'shared/controllers/city-controller';
import TestsController from 'test/controllers/tests-controller';
import DebugController from 'debug/controllers/debug-controller';
import StateController from 'shared/controllers/state-controller';
import HealthController from 'status/controllers/health-controller';
import StatusController from 'status/controllers/status-controller';
import ClinicController from 'clinic/controllers/clinic-controller';
import CountryController from 'shared/controllers/country-controller';
import PatientController from 'patient/controllers/patient-controller';
import SummaryController from 'summary/controllers/summary-controller';
import ParameterController from 'test/controllers/parameter-controller';
import BasicTestController from 'test/controllers/basic-test-controller';
import Hba1cTestController from 'test/controllers/hba1c-test-controller';
import LipidTestController from 'test/controllers/lipid-test-controller';
import CustomerController from 'customer/controllers/customer-controller';

class App {
    private swaggerSpec: any;
    public app: express.Application;

    constructor() {
        this.app = express();
        this.setupApp();
    }

    setupApp() {
        this.setupDatabase();

        this.setupCors();
        this.setupMiddlewares();
        this.setupEndpoints();

        // swagger should not work on production
        if (config.ENV_NAME != 'production') {
            this.setupSwagger();
        }
    }

    /**
     * @function setupMiddlewares
     * @description Initializes all middlewares
     */
    public setupMiddlewares() {
        this.setupCors();

        // Enable for nginx reverse proxy
        this.app.set('trust proxy', 1);

        this.app.use((request: express.Request, response: express.Response, next: any) => {
            response.setHeader('Access-Control-Allow-Methods', '*');
            response.setHeader('Access-Control-Allow-Headers', 'DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,authToken,loggedusertype,loggeduserid,clinicid');
            next();
        });

        this.app.use(helmet());

        // Apply rate limiter middleware
        const limiter = rateLimit({
            windowMs: config.RATE_LIMIT.MAX_REQUEST_INTERVAL, // in milli seconds
            max: config.RATE_LIMIT.MAX_REQUEST_COUNT, // Requests per request interval
            message: 'Too many requests from this IP, please try again after a minute.',
        });

        this.app.use('/api', limiter);

        this.app.use(bodyParser.json({ limit: '50mb' }));
        this.app.use(express.static(__dirname + '/public'));
        this.app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

        this.app.use((request: express.Request, response: express.Response, next: any) => {
            request.headers.startTime = new Date().toString();
            next();
        });

        // Configure Express to use EJS
        this.app.set("views", path.join(__dirname, "views"));
        this.app.set("view engine", "ejs");
    }

    /**
    * @function setupCors
    * @description Initializes cors
    */
    setupCors() {
        /**
         * Allow cors requests from white listed urls
         */
        const allowedOrigins = process.env.WHITE_LISTED_URLS?.split(',');

        const corsOptions = {
            origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
                if (!origin || !allowedOrigins || allowedOrigins.indexOf(origin) !== -1) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true, // Reflect the request origin, as defined by `origin` above
            optionsSuccessStatus: 200 // For legacy browser support
        };

        this.app.use(cors(corsOptions));
    }

    /**
     * @function setupEndpoints
     * @description Initializes all routes
     * @param controllers 
     */
    public setupEndpoints() {
        let that = this;

        let controllers: BaseController[] = [
            new AuthController(),
            new CityController(),
            new RoleController(),
            new SyncController(),
            new UserController(),
            new StateController(),
            new DebugController(),
            new TestsController(),
            new ClinicController(),
            new HealthController(),
            new StatusController(),
            new CountryController(),
            new PatientController(),
            new SummaryController(),
            new CustomerController(),
            new BasicTestController(),
            new Hba1cTestController(),
            new LipidTestController(),
            new ParameterController()
        ];

        controllers.forEach((controller) => {
            that.app.use('/', controller.router);
        });
    }

    private setupSwagger() {
        this.swaggerSpec = swaggerJsdoc(swaggerDefinition);
        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(this.swaggerSpec));
    }

    /**
     * @function startServer
     * @description Initializes cors
     */
    public setupDatabase() {
        if (!config.DB_CONNECTION || (config.DB_CONNECTION.length == 0)) {
            console.log('Database connection not configured');
            exit(0);
        }

        (async () => {
            // For Docker, postgresql may be starting in background, hence retry connection if failed
            let retries = 1;
            while (retries) {
                try {
                    console.log('Trying connecting: ' + retries);
                    await mongoose.connect(config.DB_CONNECTION, {});
                    console.log('Database connected');
                    break;			// Stop loop if connection established
                } catch (error) {
                    console.log('Error in connecting database');
                    console.log(error);
                }

                await new Promise((resolve) => setTimeout(resolve, 2000));

                ++retries;

                if (retries > 5)
                    break;
            }
        })();
    }

    /**
     * @function startServer
     * @description Initializes cors
     */
    public startServer() {
        const SERVER_PORT = config.SERVER_PORT;
        const SERVER_ROOT = config.SERVER_ROOT;

        const server = this.app.listen(+SERVER_PORT, '0.0.0.0', () => {
            console.log(`Server is running at ${SERVER_ROOT}...`);
            LoggerService.log('debug', { message: `Server is running at ${SERVER_ROOT}...`, location: 'app => listen' });
        });

        // Debug routes
        //this.printRoutes(this.app);
    }

    printRoutes(app: any) {
        this.app._router.stack.forEach((middleware: any) => {
            if (middleware.route) { // Routes registered directly
                console.log(`${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
            } else if (middleware.name === 'router') { // Routes added using a router
                middleware.handle.stack.forEach((handler: any) => {
                    if (handler.route) {
                        console.log(`${Object.keys(handler.route.methods).join(', ').toUpperCase()} ${handler.route.path}`);
                    }
                });
            }
        });
    }
}

// Run server now
const app = new App();
app.startServer();