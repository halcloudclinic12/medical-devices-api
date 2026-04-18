import config from 'config/app-config';
import constants from 'utils/constants';
import { User } from 'user/models/user';
import { Clinic } from 'clinic/models/clinic';
import { Patient } from 'patient/models/patient';
import { ClinicDTO } from 'clinic/dto/clinic-dto';
import BadRequestError from 'shared/errors/bad-request-error';

import AppUtils from 'utils/app-utils';
import { UserDTO } from 'user/dto/user-dto';
import JwtService from 'auth/services/jwt-service';
import RoleService from 'user/services/role-service';
import UserService from 'user/services/user-service';
import { PatientDTO } from 'patient/dto/patient-dto';
import { SmsService } from 'shared/services/sms-service';
import LoggerService from 'shared/services/logger-service';
import PatientService from 'patient/services/patient-service';
import EncryptionService from 'shared/services/encryption-service';

export default class AuthService {
    private readonly smsService: SmsService;
    private readonly userService: UserService;
    private readonly roleService: RoleService;
    private readonly patientService: PatientService;

    constructor() {
        this.smsService = new SmsService();
        this.roleService = new RoleService();
        this.userService = new UserService();
        this.patientService = new PatientService();
    }

    async userLogin(data: any, headers: any = null) {
        if (this.isEmpty(data.username)) {
            throw new BadRequestError('Invalid username');
        }
        if (!data.hasOwnProperty('password')) {
            throw new BadRequestError('Invalid password');
        }

        let user: any = await User.findOne({ email: data.username });
        if (user) {
            // check if user password is correct
            if (EncryptionService.verifyWithBcrypt(data.password, user.password)) {
                user = new UserDTO(user);

                // load user roles
                if (user.role_id) {
                    let role: any = await this.roleService.findRecord(user.role_id);
                    user.role = role;
                }

                let token = JwtService.generateToken(user._id);
                let refreshToken = JwtService.generateRefreshToken(user._id);

                return {
                    valid: true,
                    token: token,
                    user: user,
                    refresh_token: refreshToken
                };
            } else {
                return {
                    valid: false,
                    message: constants.MESSAGES.ERRORS.INVALID_LOGIN
                };
            }
        } else {
            return {
                valid: false,
                message: constants.MESSAGES.ERRORS.INVALID_LOGIN
            };
        }
    }

    async clinicLogin(data: any, headers: any = null) {
        if (this.isEmpty(data.clinic_id)) {
            throw new BadRequestError('Invalid clinic id');
        }
        if (!data.hasOwnProperty('password')) {
            throw new BadRequestError('Invalid password');
        }

        let clinic: any = await Clinic.findOne({ clinic_id: data.clinic_id });
        if (clinic) {
            // check if user password is correct
            if (EncryptionService.verifyWithBcrypt(data.password, clinic.password)) {
                clinic = new ClinicDTO(clinic);

                let token = JwtService.generateToken(clinic._id);
                let refreshToken = JwtService.generateRefreshToken(clinic._id);

                return {
                    valid: true,
                    token: token,
                    clinic: clinic,
                    refresh_token: refreshToken
                };
            } else {
                return {
                    valid: false,
                    message: constants.MESSAGES.ERRORS.INVALID_LOGIN
                };
            }
        } else {
            return {
                valid: false,
                message: constants.MESSAGES.ERRORS.NOT_FOUND
            };
        }
    }

    async patientLogin(data: any, headers: any = null) {
        if (!data.hasOwnProperty('mobile') || this.isEmpty(data.mobile)) {
            throw new BadRequestError('Invalid mobile');
        }

        try {
            let patient = await Patient.findOne({ mobile: data.mobile });

            if (patient) {
                // check and update fcm token of patient if provided
                if (data.fcm_token) {
                    await Patient.updateOne({ mobile: data.mobile }, { fcm_token: data.fcm_token });
                }

                if (config.IS_OTP_VERIFICATION_ENABLED === true) {
                    // Store otp against patient
                    let otp = AppUtils.generateOTP();
                    await Patient.updateOne({ mobile: data.mobile }, { otp: otp });

                    let smsBody = 'Your OTP for login is ' + otp;
                    try {
                        let success = await this.smsService.send({ mobile: data.mobile, body: smsBody });

                        if (success) {
                            return {
                                otp: otp,
                                valid: true,
                                message: constants.MESSAGES.VERIFY_OTP
                            };
                        }
                        else {
                            throw new Error(constants.MESSAGES.ERRORS.CANNOT_SEND_SMS);
                        }
                    } catch (error) {
                        LoggerService.log('error', { error: error, message: constants.MESSAGES.ERRORS.CANNOT_SEND_SMS, location: 'auth-serv => patientLogin' });
                        throw error;
                    }
                } else {
                    return {
                        success: true,
                        patient: new PatientDTO(patient)
                    };
                }
            } else {
                return await this.patientService.store(data, headers);
            }
        } catch (error) {
            LoggerService.log('error', { error: error, message: constants.MESSAGES.ERRORS.PATIENT_LOGIN_FAILED, location: 'auth-serv => patientLogin' });
            throw error;
        }
    }

    async verifyPatientLogin(data: any, headers: any = null) {
        if (data.hasOwnProperty('otp') && data.hasOwnProperty('mobile')) {
            if (this.isEmpty(data.otp) || Number.isNaN(data.otp)) {
                return new BadRequestError('Invalid otp');
            } else if (this.isEmpty(data.mobile)) {
                return new BadRequestError('Invalid mobile');
            } else {
                let patient: any = await Patient.findOne({ mobile: data.mobile });

                if (patient) {
                    if (data.otp == patient.otp) {
                        const token = JwtService.generateToken(patient._id, { expiresIn: '24h' });
                        let refreshToken = JwtService.generateRefreshToken(patient._id);

                        return {
                            valid: true,
                            token: token,
                            refreshToken: refreshToken
                        };
                    } else {
                        return {
                            valid: false
                        };
                    }
                } else {
                    return {
                        valid: false
                    };
                }
            }
        } else {
            if (!data.hasOwnProperty('mobile')) {
                return new BadRequestError(constants.MESSAGES.ERRORS.INVALID_MOBILE);
            }
            else if (!data.hasOwnProperty('otp')) {
                return new BadRequestError(constants.MESSAGES.ERRORS.INVALID_OTP);
            } else {
                return new BadRequestError(null);
            }
        }
    }

    async getRefreshToken(params: any, headers: any = null) {
        let result: any = await JwtService.verifyRefreshToken(params.refresh_token);

        if (result.valid) {
            let token = JwtService.generateToken(result.id);
            let refreshToken = JwtService.generateRefreshToken(result.id);

            return {
                token: token,
                refreshToken: refreshToken
            };
        } else {
            throw new Error('Invalid refresh token');
        }
    }

    async verifyRefreshToken(params: any, headers: any) {
        let token: string = params.token;
        if (token) {
            let result: any = await JwtService.verifyRefreshToken(token);
            return result?.valid ? { valid: true } : { valid: false };
        } else {
            return {
                valid: false
            };
        }
    }

    async forgotPassword(data: any, headers: any = null) {
        return await this.userService.forgotPassword(data, headers);
    }

    async verifyForgotPassword(data: any, headers: any = null) {
        return await this.userService.verifyForgotPassword(data, headers);
    }

    async resetPassword(data: any, headers: any = null) {
        return await this.userService.resetPassword(data, headers);
    }

    isEmpty(str: string) {
        return str == null || str.toString().trim().length == 0;
    }
}