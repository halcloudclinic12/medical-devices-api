import mongoose from 'mongoose';

import config from 'config/app-config';
import AppUtils from 'utils/app-utils';
import constants from 'utils/constants';
import { UserDTO } from 'user/dto/user-dto';
import { User, IPasswordReset } from 'user/models/user';
import BadConfigError from 'shared/errors/bad-config-error';
import BadRequestError from 'shared/errors/bad-request-error';

import RoleService from './role-service';
import JwtService from 'auth/services/jwt-service';
import AwsService from 'shared/services/aws-service';
import FileService from 'shared/services/file-service';
import EmailService from 'shared/services/email-service';
import LoggerService from 'shared/services/logger-service';
import SummaryService from 'summary/services/summary-service';
import EncryptionService from 'shared/services/encryption-service';

export default class UserService {
    private readonly awsService: AwsService;
    private readonly fileService: FileService;
    private readonly roleService: RoleService;
    private readonly emailService: EmailService;
    private readonly summaryService: SummaryService;

    constructor() {
        this.awsService = new AwsService();
        this.fileService = new FileService();
        this.roleService = new RoleService();
        this.emailService = new EmailService();
        this.summaryService = new SummaryService();
    }

    async findRecord(id: string, headers: any = null) {
        try {
            let result: any = await this.getUserData({ _id: mongoose.mongo.ObjectId.createFromHexString(id) }, headers);
            return result?.data?.length ? new UserDTO(result.data[0]) : null;
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Cannot get user data', location: 'user-serv => find' });
            throw error;
        }
    }

    async findOne(filter: any, headers: any) {
        try {
            let result: any = await this.getUserData(filter, headers);
            return result?.data?.length > 0 ? new UserDTO(result.data[0]) : null;
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Cannot get user data', location: 'user-serv => findOne' });
            throw error;
        }
    }

    async getUserData(filter: any, headers: any) {
        const result = await User.aggregate([
            {
                $match: filter
            },
            {
                $facet: {
                    total: [
                        { $count: "count" }
                    ],
                    data: [
                        {
                            $lookup: {
                                from: "roles",
                                localField: "role_id",
                                foreignField: "_id",
                                as: "role"
                            }
                        },
                        {
                            $unwind: {
                                path: "$role",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                customer_id: 1,
                                creator_user_id: 1,
                                belongs_to_customer: 1,
                                is_customer: 1,
                                first_name: 1,
                                last_name: 1,
                                role_id: 1,
                                mobile: 1,
                                role: 1,
                                email: 1,
                                user_type: 1,
                                is_active: 1,
                                is_deleted: 1,
                                created_at: 1,
                                gender: 1,
                                date_of_birth: 1,
                                image_file: 1
                            }
                        }
                    ]
                }
            }
        ]);

        return result?.[0] ?? null;
    }

    async store(data: any, headers: any) {
        let user: any = {};

        let password;
        if (data.password) {
            password = data.password;
        } else {
            password = config.DEFAULT_USER_PASSWORD;
        }

        if (data.email) {
            user.email = data.email;
            user.username = data.email;
        }

        if (data.mobile) {
            user.mobile = data.mobile;

            if (!user.username) {
                user.username = data.mobile;
            }
        }

        if (data.fcm_token)
            user.fcm_token = data.fcm_token;

        try {
            let result: any = await this.isDuplicateUser(data, false);
            if (result.duplicate) {
                return {
                    success: false,
                    duplicate: true,
                    message: result.message
                };
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Cannot check duplicate user', location: 'user-serv => store' });
            throw error;
        }

        if (data.role_id) {
            user.role_id = data.role_id;
        } else {
            let role: any = await this.roleService.findOne({ name: constants.ROLES.USER });
            if (!role) {
                throw new Error('User role is not defined');
            }
            user.role_id = role._id;
        }

        user.is_active = true;
        user.is_verified = false;
        user.last_name = data.last_name;
        user.first_name = data.first_name;
        user.unique_id = AppUtils.getUniqueId();
        user.gender = data.gender ? data.gender : null;
        user.password = EncryptionService.encryptWithBcrypt(password);
        user.creator_user_id = mongoose.mongo.ObjectId.createFromHexString(headers.loggeduserid);

        const loggedInUser: any = await this.findRecord(headers.loggeduserid);
        if (!loggedInUser) throw new Error('Unauthorized or invalid user');

        if (loggedInUser.user_type === constants.USER_TYPES.CUSTOMER) {
            // ✅ Customer creating user under them
            user.is_customer = false;
            user.belongs_to_customer = true;
            user.customer_id = loggedInUser._id;
            user.user_type = constants.USER_TYPES.USER;
        } else if (loggedInUser.belongs_to_customer) {
            // ✅ Customer's user creating another user under same customer
            user.is_customer = false;
            user.belongs_to_customer = true;
            user.user_type = constants.USER_TYPES.USER;
            user.customer_id = loggedInUser.customer_id;
        } else {
            // ✅ Admin or system user creating a user
            user.customer_id = null;
            user.is_customer = false;
            user.belongs_to_customer = false;
            user.user_type = constants.USER_TYPES.USER;
        }

        if (data.imageFile && config.AWS.S3_IMAGE_BUCKET) {
            let file_name = data.image.file_name;
            let mime_type = AppUtils.getMimeType(data.image.file_name);
            let saved_file_name = AppUtils.getUniqueFilename() + "_" + file_name;

            // Check if it's an SVG by matching against the MIME type
            const isSvg = data.image.base64.startsWith('data:image/svg+xml');
            let fileContent: Buffer;

            if (isSvg) {
                // For SVG, base64 should be decoded into a string (text-based)
                const base64Data = data.image.base64.replace(/^data:image\/svg\+xml;base64,/, '');
                fileContent = Buffer.from(base64Data, 'base64'); // Still using Buffer, but no binary data handling issues
            } else {
                // Handle other image formats as binary
                const base64Data = data.image.base64.replace(/^data:image\/\w+;base64,/, '');
                fileContent = Buffer.from(base64Data, 'base64');
            }

            let uploadResponse: any = await this.awsService.uploadFile('user-image/' + saved_file_name, fileContent, config.AWS.S3_IMAGE_BUCKET, mime_type);

            if (uploadResponse) {
                user.image_file = saved_file_name;
            } else {
                user.image_file = constants.DEFAULTS.USER_IMAGE;
            }
        }

        try {
            user = await User.create(user);

            try {
                await this.summaryService.addUser()
            } catch (error: any) {
                LoggerService.log('error', { error: error, message: 'Cannot add patient summary', location: 'patient-serv => store' });
                throw error;
            }

            // Fetch the complete user data with role populated
            const completeUser = await this.findRecord(user._id.toString(), headers);

            return {
                success: true,
                user: completeUser || new UserDTO(user)
            };
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Cannot create user', location: 'user-serv => store' });
            throw error;
        }
    }

    async isDuplicateUser(data: any, forUpdate: boolean, id: any = null) {
        let user: any = null;
        let where: any = null;

        // if we are updating existing record
        if (forUpdate) {
            if (data.email && data.mobile) {
                where = {
                    $and: [
                        {
                            $or: [
                                { email: data.email },
                                { mobile: data.mobile }
                            ]
                        }
                    ],
                    _id: { $ne: id } // Exclude the current user from the check
                };
            }
            else if (data.email) {
                where = {
                    $and: [
                        { email: data.email }
                    ],
                    _id: { $ne: id } // Exclude the current user from the check
                };
            }
            else if (data.mobile) {
                where = {
                    $or: [
                        { mobile: data.mobile }
                    ],
                    _id: { $ne: id } // Exclude the current user from the check
                };
            } else {
                return {
                    duplicate: false
                };
            }
        } else {
            // Creating a new user
            if (data.email && data.mobile) {
                where = {
                    $or: [
                        { email: data.email },
                        { mobile: data.mobile }
                    ]
                };
            }
            else if (data.email) {
                user = await User.findOne({
                    $or: [
                        { email: data.email }
                    ]
                });
            }
            else if (data.mobile) {
                user = await User.findOne({
                    $or: [
                        { mobile: data.mobile }
                    ]
                });
            } else {
                throw new BadRequestError('Email or mobile is required');
            }
        }

        user = await User.findOne(where);

        if (user) {
            if (user.email == data.email) {
                return {
                    duplicate: true,
                    message: 'Duplicate email'
                };
            } else if (user.mobile == data.mobile) {
                return {
                    duplicate: true,
                    message: 'Duplicate mobile'
                };
            } else {
                return {
                    duplicate: true,
                    message: 'Invalid'
                };
            }
        } else {
            return {
                duplicate: false
            };
        }
    }

    async resetPassword(data: any, headers: any) {
        try {
            let user: any = await this.findOne({ _id: mongoose.mongo.ObjectId.createFromHexString(data.id) }, headers);
            if (user) {
                if (EncryptionService.verifyWithBcrypt(data.old_password, user.password)) {
                    await this.update(data.id, { password: data.new_password });
                    return {
                        success: true
                    };
                } else {
                    return {
                        success: false,
                        message: constants.MESSAGES.ERRORS.OLD_PASSWORD_MISMATCH
                    };
                }
            } else {
                return {
                    success: false,
                    message: constants.MESSAGES.ERRORS.NOT_FOUND
                };
            }
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Cannot reset password', location: 'user-serv => resetPassword' });
            throw error;
        }
    }

    async update(id: any, data: any, headers: any = null) {
        let user = await User.findById({ _id: id });

        if (user) {
            try {
                let result: any = await this.isDuplicateUser(data, true, id);
                if (result.duplicate) {
                    return {
                        success: false,
                        message: result.message
                    };
                }
            } catch (error: any) {
                LoggerService.log('error', { error: error, message: 'Cannot check duplicate user', location: 'user-serv => update' });
                throw error;
            }

            try {
                let userDataToUpdate: any = this.getUpdatedUser(data);

                // Remove temporary loaded role object
                delete user.role;

                if (data.hasOwnProperty('password')) {
                    userDataToUpdate.password = EncryptionService.encryptWithBcrypt(data.password);
                }

                await User.updateOne({ _id: id }, userDataToUpdate);

                return {
                    success: true
                };
            } catch (error: any) {
                LoggerService.log('error', { error: error, message: 'Cannot update user', location: 'user-serv => update' });
                throw error;
            }
        } else {
            return null;
        }
    }

    getUpdatedUser(data: any) {
        let userDataToUpdate: any = {};

        if (data.hasOwnProperty('pin')) userDataToUpdate.pin = data.pin;
        if (data.hasOwnProperty('email')) userDataToUpdate.email = data.email;
        if (data.hasOwnProperty('mobile')) userDataToUpdate.mobile = data.mobile;
        if (data.hasOwnProperty('gender')) userDataToUpdate.gender = data.gender;
        if (data.hasOwnProperty('role_id')) userDataToUpdate.role_id = data.role_id;
        if (data.hasOwnProperty('last_name')) userDataToUpdate.last_name = data.last_name;
        if (data.hasOwnProperty('user_type')) userDataToUpdate.user_type = data.user_type;
        if (data.hasOwnProperty('first_name')) userDataToUpdate.first_name = data.first_name;
        if (data.hasOwnProperty('date_of_birth')) userDataToUpdate.date_of_birth = data.date_of_birth;
        if (data.hasOwnProperty('is_test_account')) userDataToUpdate.is_test_account = data.is_test_account;

        if (data.hasOwnProperty('is_active')) {
            userDataToUpdate.is_active = data.is_active;
            // If activating a user, also mark them as not deleted
            if (data.is_active === true) {
                userDataToUpdate.is_deleted = false;
            }
        }
        if (data.hasOwnProperty('is_deleted')) userDataToUpdate.is_deleted = data.is_deleted;

        return userDataToUpdate;
    }

    async updateImage(data: any, headers: any = null) {
        if (!config.AWS.S3_IMAGE_BUCKET) {
            throw new Error('S3 bucket not defined');
        }

        if (!data.image) {
            throw new BadRequestError('Image not provided');
        }

        let user: any = User.findById({ _id: headers.loggeduserid });

        if (user) {
            if (data.image) {
                let file_name = data.image.file_name;
                let mime_type = AppUtils.getMimeType(data.image.file_name);
                let saved_file_name = AppUtils.getUniqueFilename() + "_" + file_name;

                // Check if it's an SVG by matching against the MIME type
                const isSvg = data.image.base64.startsWith('data:image/svg+xml');
                let fileContent: Buffer;

                if (isSvg) {
                    // For SVG, base64 should be decoded into a string (text-based)
                    const base64Data = data.image.base64.replace(/^data:image\/svg\+xml;base64,/, '');
                    fileContent = Buffer.from(base64Data, 'base64'); // Still using Buffer, but no binary data handling issues
                } else {
                    // Handle other image formats as binary
                    const base64Data = data.image.base64.replace(/^data:image\/\w+;base64,/, '');
                    fileContent = Buffer.from(base64Data, 'base64');
                }

                let uploadResponse: any = await this.awsService.uploadFile('user-image/' + saved_file_name, fileContent, config.AWS.S3_IMAGE_BUCKET, mime_type);

                if (uploadResponse) {
                    try {
                        await User.updateOne({ _id: headers.loggeduserid }, { image_file: saved_file_name });
                        return {
                            success: true
                        };
                    } catch (error: any) {
                        LoggerService.log('error', { error: error, message: 'Error in adding user image', 'location': 'user-sev => updateImage' });
                        throw error;
                    }
                } else {
                    return {
                        error: true,
                        success: false,
                        message: 'Could not upload image to storage'
                    };
                }
            } else {
                return {
                    error: true,
                    success: false,
                    message: 'Image not provided'
                };
            }
        } else {
            return null;
        }
    }

    async filterRecords(data: any, headers: any = null) {
        let where: any = {};

        if (data.hasOwnProperty('is_active')) { where.is_active = data.is_active };
        if (data.hasOwnProperty('email')) { where.email = data.email };
        if (data.hasOwnProperty('mobile')) { where.mobile = data.mobile };
        if (data.hasOwnProperty('first_name')) { where.first_name = data.first_name };
        if (data.hasOwnProperty('last_name')) { where.last_name = data.last_name };

        // Exclude CUSTOMER user type from users API
        where.user_type = { $ne: constants.USER_TYPES.CUSTOMER };

        const loggedInUserId = headers?.loggeduserid;
        const loggedInUser = await User.findById(loggedInUserId).lean();
        if (!loggedInUser) { throw new Error('Unauthorized or invalid user'); }

        if (loggedInUser.user_type === constants.USER_TYPES.CUSTOMER) {
            // Case: Customer
            where['$or'] = [
                { _id: loggedInUser._id },                      // The customer themselves
                { customer_id: loggedInUser._id },              // All users under this customer
                { creator_user_id: loggedInUser._id },          // Users created by this customer
            ];
        } else if (loggedInUser.belongs_to_customer) {
            // Case: Customer's user
            where.customer_id = loggedInUser.customer_id;
        } else {
            // Case: Administrator - see themselves and all users without customer_id
            where['$or'] = [
                { customer_id: null },                          // Users with no customer
                { customer_id: { $exists: false } }             // Users where customer_id doesn't exist
            ];
        }

        let pageNumber = 1;
        let pageSize = constants.DEFAULT_PAGED_RECORDS;

        if (data.page_number) {
            pageNumber = parseInt(data.page_number, 10);
        }
        if (data.page_size) {
            pageSize = parseInt(data.page_size, 10);
        }

        const skip = (pageNumber - 1) * pageSize;

        let sort: any = { 'sort_order': 1 };
        if (data.latest) {
            sort = { 'created_at': -1 };
        }

        const result = await User.aggregate([
            { $match: where },
            { $sort: sort },
            {
                $facet: {
                    total: [
                        { $count: "count" }
                    ],
                    data: [
                        { $skip: skip },
                        { $limit: pageSize },
                        {
                            $lookup: {
                                from: "roles",
                                localField: "role_id",
                                foreignField: "_id",
                                as: "role"
                            }
                        },
                        {
                            $unwind: {
                                path: "$role",
                                preserveNullAndEmptyArrays: true
                            }
                        }
                    ]
                }
            }
        ]);

        const users = result?.[0]?.data || [];
        const total = result?.[0]?.total?.[0]?.count || 0;
        const records = users.map((user: any) => new UserDTO(user));

        return { total, records };
    }

    async forgotPassword(data: any, headers: any = null) {
        let user: any = await this.findOne({ email: data.email }, headers);
        if (user) {
            await this.storeForgotPassword(user);

            try {
                const token = JwtService.generateToken(user._id, { expiresIn: '24h' });
                await this.sendForgotPasswordEmail(user, token);
            } catch (error: any) {
                LoggerService.log('error', { error: error, message: 'Cannot send forgot password email', location: 'user-serv => forgotPassword' });
                throw error;
            }

            return {
                success: true,
                message: constants.MESSAGES.FORGOT_PASSWORD_EMAIL_SENT
            };
        } else {
            return null;
        }
    }

    async storeForgotPassword(user: any) {
        const newPasswordReset: IPasswordReset = {
            created_at: new Date()
        };

        let password_resets = user.password_resets;
        if (!user.password_resets) {
            password_resets = [];
        }

        password_resets.push(newPasswordReset);

        await User.updateOne({ id: user._id }, {
            password_resets: password_resets
        });
    }

    async verifyForgotPassword(data: any, headers: any = null) {
        const decoded: any = await JwtService.verifyToken(data.token);

        const user = await User.findById(decoded.id);
        if (user) {
            return {
                success: true
            };
        } else {
            return {
                success: false,
            };
        }
    }

    async sendForgotPasswordEmail(user: any, token: string) {
        if (config.DOMAIN_URL) {
            let data: any = {};

            let link = config.DOMAIN_URL + '/reset-password/' + token;

            if (config.EMAIL.USE_PROVIDER_EMAIL_TEMPLATES === true) {
                data.templateId = config.EMAIL.FORGOT_PASSWORD_EMAIL_TEMPLATE_ID;
                data.templateVariables = {
                    LINK: link,
                    NAME: user.first_name
                };
            } else {
                let templateContentBuffer = this.fileService.getTemplate(data, constants.TEMPLATES.FORGOT_PASSWORD);

                let templateContent = templateContentBuffer.toString().replace('{LINK}', link);

                data.email = user.email;
                data.body = templateContent;
                data.name = user.first_name;
            }

            await this.emailService.sendForgotPasswordEmail(data, constants.SUBJECTS.FORGOT_PASSWORD);
        } else {
            LoggerService.log('error', { message: 'Domain not specified for reset password link', location: 'user-serv => sendForgotPasswordEmail' });
            throw new BadConfigError('Domain not specified for reset password link');
        }
    }

    async remove(id: any, headers: any = null) {
        let user = await User.findOne({ _id: id });
        if (user) {
            return await User.updateOne({ _id: id }, { is_active: false, updated_at: new Date() });
        } else {
            return null;
        }
    }
}