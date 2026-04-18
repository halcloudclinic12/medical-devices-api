import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { Options } from 'swagger-jsdoc';
import config from '../config/app-config';

const loadSchema = (relPath: string) => {
    const fullPath = path.resolve(__dirname, "schemas", relPath);
    return yaml.load(fs.readFileSync(fullPath, "utf8"));
};

const syncRequestSchema = loadSchema('request/sync-request.yaml');
const cityCreateRequestSchema = loadSchema('request/city-create-request.yaml');
const userCreateRequestSchema = loadSchema('request/user-create-request.yaml');
const stateCreateRequestSchema = loadSchema('request/state-create-request.yaml');
const countryCreateRequestSchema = loadSchema('request/country-create-request.yaml');
const patientCreateRequestSchema = loadSchema('request/patient-create-request.yaml');
const customerCreateRequestSchema = loadSchema('request/customer-create-request.yaml');
const parameterCreateRequestSchema = loadSchema('request/parameter-create-request.yaml');
const basicTestCreateRequestSchema = loadSchema('request/basic-test-create-request.yaml');
const hba1cTestCreateRequestSchema = loadSchema('request/hba1c-test-create-request.yaml');
const lipidTestCreateRequestSchema = loadSchema('request/lipid-test-create-request.yaml');

const userUpdateRequestSchema = loadSchema('request/user-update-request.yaml');
const cityUpdateRequestSchema = loadSchema('request/city-update-request.yaml');
const stateUpdateRequestSchema = loadSchema('request/state-update-request.yaml');
const countryUpdateRequestSchema = loadSchema('request/country-update-request.yaml');
const patientUpdateRequestSchema = loadSchema('request/patient-update-request.yaml');
const customerUpdateRequestSchema = loadSchema('request/customer-update-request.yaml');
const parameterUpdateRequestSchema = loadSchema('request/parameter-update-request.yaml');

const cityCreateResponseSchema = loadSchema('response/city-create-response.yaml');
const userCreateResponseSchema = loadSchema('response/user-create-response.yaml');
const stateCreateResponseSchema = loadSchema('response/state-create-response.yaml');
const patientCreateResponseSchema = loadSchema('response/patient-create-response.yaml');
const countryCreateResponseSchema = loadSchema('response/country-create-response.yaml');
const customerCreateResponseSchema = loadSchema('response/customer-create-response.yaml');

const cityDetailResponseSchema = loadSchema('response/city-detail-response.yaml');
const userDetailResponseSchema = loadSchema('response/user-detail-response.yaml');
const stateDetailResponseSchema = loadSchema('response/state-detail-response.yaml');
const countryDetailResponseSchema = loadSchema('response/country-detail-response.yaml');
const patientDetailResponseSchema = loadSchema('response/patient-detail-response.yaml');
const customerDetailResponseSchema = loadSchema('response/customer-detail-response.yaml');
const parameterDetailResponseSchema = loadSchema('response/parameter-detail-response.yaml');
const basicTestDetailResponseSchema = loadSchema('response/basic-test-detail-response.yaml');
const hba1cTestDetailResponseSchema = loadSchema('response/hba1c-test-detail-response.yaml');
const lipidTestDetailResponseSchema = loadSchema('response/lipid-test-detail-response.yaml');

const summaryResponseSchema = loadSchema('response/summary-response.yaml');
const cityListResponseSchema = loadSchema('response/city-list-response.yaml');
const roleListResponseSchema = loadSchema('response/role-list-response.yaml');
const userListResponseSchema = loadSchema('response/user-list-response.yaml');
const stateListResponseSchema = loadSchema('response/state-list-response.yaml');
const countryListResponseSchema = loadSchema('response/country-list-response.yaml');
const patientListResponseSchema = loadSchema('response/patient-list-response.yaml');
const customerListResponseSchema = loadSchema('response/customer-list-response.yaml');
const parameterListResponseSchema = loadSchema('response/parameter-list-response.yaml');
const basicTestListResponseSchema = loadSchema('response/basic-test-list-response.yaml');
const hba1cTestListResponseSchema = loadSchema('response/hba1c-test-list-response.yaml');
const lipidTestListResponseSchema = loadSchema('response/lipid-test-list-response.yaml');
const summaryGroupedResponseSchema = loadSchema('response/summary-grouped-response.yaml');

export const swaggerDefinition: Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Healthbox Documentation',
            version: '1.0.0',
            description: 'This is the API documentation for Healthbox',
        },
        servers: [
            {
                url: config.SERVER_ROOT,
                description: config.ENV_NAME,
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                SyncRequestSchema: syncRequestSchema,
                CityCreateRequestSchema: cityCreateRequestSchema,
                UserCreateRequestSchema: userCreateRequestSchema,
                StateCreateRequestSchema: stateCreateRequestSchema,
                CountryCreateRequestSchema: countryCreateRequestSchema,
                PatientCreateRequestSchema: patientCreateRequestSchema,
                CustomerCreateRequestSchema: customerCreateRequestSchema,
                BasicTestCreateRequestSchema: basicTestCreateRequestSchema,
                Hba1cTestCreateRequestSchema: hba1cTestCreateRequestSchema,
                LipidTestCreateRequestSchema: lipidTestCreateRequestSchema,
                ParameterCreateRequestSchema: parameterCreateRequestSchema,

                UserUpdateRequestSchema: userUpdateRequestSchema,
                CityUpdateRequestSchema: cityUpdateRequestSchema,
                StateUpdateRequestSchema: stateUpdateRequestSchema,
                CountryUpdateRequestSchema: countryUpdateRequestSchema,
                PatientUpdateRequestSchema: patientUpdateRequestSchema,
                CustomerUpdateRequestSchema: customerUpdateRequestSchema,
                ParameterUpdateRequestSchema: parameterUpdateRequestSchema,

                CityCreateResponseSchema: cityCreateResponseSchema,
                CityDetailResponseSchema: cityDetailResponseSchema,
                UserCreateResponseSchema: userCreateResponseSchema,
                StateCreateResponseSchema: stateCreateResponseSchema,
                CountryCreateResponseSchema: countryCreateResponseSchema,
                PatientCreateResponseSchema: patientCreateResponseSchema,
                CustomerCreateResponseSchema: customerCreateResponseSchema,

                UserDetailResponseSchema: userDetailResponseSchema,
                StateDetailResponseSchema: stateDetailResponseSchema,
                CountryDetailResponseSchema: countryDetailResponseSchema,
                PatientDetailResponseSchema: patientDetailResponseSchema,
                CustomerDetailResponseSchema: customerDetailResponseSchema,
                BasicTestDetailResponseSchema: basicTestDetailResponseSchema,
                Hba1cTestDetailResponseSchema: hba1cTestDetailResponseSchema,
                LipidTestDetailResponseSchema: lipidTestDetailResponseSchema,
                ParameterDetailResponseSchema: parameterDetailResponseSchema,

                SummaryResponseSchema: summaryResponseSchema,
                CityListResponseSchema: cityListResponseSchema,
                RoleListResponseSchema: roleListResponseSchema,
                UserListResponseSchema: userListResponseSchema,
                StateListResponseSchema: stateListResponseSchema,
                CountryListResponseSchema: countryListResponseSchema,
                PatientListResponseSchema: patientListResponseSchema,
                CustomerListResponseSchema: customerListResponseSchema,
                BasicTestListResponseSchema: basicTestListResponseSchema,
                Hba1cTestListResponseSchema: hba1cTestListResponseSchema,
                LipidTestListResponseSchema: lipidTestListResponseSchema,
                ParameterListResponseSchema: parameterListResponseSchema,
                SummaryGroupedResponseSchema: summaryGroupedResponseSchema,
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: [
        path.resolve(__dirname, '../auth/controllers/*.js'),
        path.resolve(__dirname, '../sync/controllers/*.js'),
        path.resolve(__dirname, '../test/controllers/*.js'),
        path.resolve(__dirname, '../test/controllers/*.js'),
        path.resolve(__dirname, '../user/controllers/*.js'),
        path.resolve(__dirname, '../debug/controllers/*.js'),
        path.resolve(__dirname, '../shared/controllers/*.js'),
        path.resolve(__dirname, '../patient/controllers/*.js'),
        path.resolve(__dirname, '../summary/controllers/*.js'),
        path.resolve(__dirname, '../customer/controllers/*.js'),

        './swagger/schemas/*.yaml'
    ]
};

// Note: In swagger, when you click on Authorize button, put value of token received in login