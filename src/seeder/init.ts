import path from 'path';
import { exit } from 'process';
import mongoose from 'mongoose';

import AppUtils from 'utils/app-utils';
import { Role } from 'user/models/role';
import constants from 'utils/constants';
import { User } from 'user/models/user';
import appConfig from 'config/app-config';
import FileService from 'shared/services/file-service';
import EncryptionService from 'shared/services/encryption-service';

export default class InitialSetup {
    private fileService: FileService;

    constructor() {
        this.fileService = new FileService();
    }

    async setupData() {
        await mongoose.connect(appConfig.DB_CONNECTION, {});
        console.log('Connected to database');

        if (await this.isDataAlreadySetup()) {
            console.log('Seed data already setup');
            exit(0);
        }

        try {
            let adminRole: any = await this.createRoles();
            await this.createAdminUsers(adminRole);
        } catch (error) {
            console.log('Error in setting up seed data');
            console.log(error);
            exit(0);
        }

        console.log('Seed data setup successfully');
        exit(0);
    }

    async isDataAlreadySetup() {
        return await User.exists({});
    }

    async createRoles() {
        let adminRole: any = null;

        let filePath = path.join(__dirname, './seed-data/roles.json');
        let fileContent = this.fileService.readFile(filePath);

        if (fileContent) {
            let roles = JSON.parse(fileContent.toString());
            if (roles) {
                for (let role of roles) {
                    role.is_active = true;
                    role.created_at = new Date();
                    role.unique_id = AppUtils.getUniqueId();

                    if (role.permissions) {
                        for (let permission of role.permissions) {
                            permission.unique_id = AppUtils.getUniqueId();
                        }
                    }

                    const createdRole = await Role.create(role);

                    if (role.name.toUpperCase() == constants.ROLES.ADMINISTRATOR) {
                        adminRole = createdRole;
                    }
                }

                console.log('Roles created successfully');
            }
        }

        return adminRole;
    }

    async createAdminUsers(adminRole: any) {
        let adminUser: any = null;
        let createdUser: any = null;

        let usersFilePath = path.join(__dirname, './seed-data/users.json');

        let usersFileContent = this.fileService.readFile(usersFilePath);
        if (usersFileContent) {
            let users = JSON.parse(usersFileContent.toString());
            if (users) {
                for (let user of users) {
                    user.is_active = true;
                    user.role_id = adminRole._id;
                    user.created_at = new Date();
                    user.unique_id = AppUtils.getUniqueId();
                    user.password = EncryptionService.encryptWithBcrypt(user.password);

                    // First user creates itself (chicken-and-egg solution)
                    if (!adminUser) {
                        // Create with temporary creator_user_id
                        user.creator_user_id = new mongoose.Types.ObjectId();
                        createdUser = await User.create(user);

                        // Update to reference itself as creator
                        await User.updateOne(
                            { _id: createdUser._id },
                            { $set: { creator_user_id: createdUser._id } }
                        );

                        adminUser = createdUser;
                    } else {
                        // Subsequent users are created by the first admin
                        user.creator_user_id = adminUser._id;
                        createdUser = await User.create(user);
                    }
                }

                console.log('Admin users created successfully');
            }
        }

        return adminUser;
    }
}

let setup = new InitialSetup();
setup.setupData();
