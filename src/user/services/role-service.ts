import AppUtils from 'utils/app-utils';
import constants from 'utils/constants';
import { RoleDTO } from 'user/dto/role-dto';
import { IRole, Role } from 'user/models/role';
import LoggerService from 'shared/services/logger-service';

export default class RoleService {
    async findRecord(id: string, headers: any = null) {
        let role: any = await Role.findById({ _id: id });
        if (role) {
            if (role.permissions && role.permissions.length > 0) {
                role.permissions = role.permissions.sort((a: any, b: any) => a.module.localeCompare(b.module));
            }

            return role;
        } else {
            return null;
        }
    }

    async findOne(filter: any) {
        let role = await Role.findOne(filter);
        if (role) {
            if (role.permissions && role.permissions.length > 0) {
                role.permissions = role.permissions.sort((a, b) => a.module.localeCompare(b.module));
            }

            return role;
        } else {
            return null;
        }
    }

    async filterRecords(data: any, headers: any = null) {
        let where: any = {};

        if (data) {
            if (data.hasOwnProperty('is_active')) {
                where.is_active = data.is_active;
            } else {
                where.is_active = true;
            }
        } else {
            where.is_active = true;
        }
        let pageNumber = 1;
        let pageSize = constants.DEFAULT_PAGED_RECORDS;

        if (data.page_number) {
            pageNumber = data.page_number;
        }
        if (data.page_size) {
            pageSize = data.page_size;
        }

        const skip = (pageNumber - 1) * pageSize;

        let sort: any = { 'sort_order': 1 };
        if (data.latest) {
            sort = { 'created_at': -1 };
        }

        let roles: any = await Role.find(where)
            .sort(sort)
            .skip(skip)
            .limit(pageSize);

        let records = roles.map((role: any) => new RoleDTO(role));

        let total = await Role.countDocuments(where);

        return { total, records };
    }

    async store(data: any, headers: any = null) {
        let role: any = await this.findOne({ name: data.name });
        if (role) {
            return {
                success: false,
                message: constants.MESSAGES.ERRORS.DUPLICATE
            };
        }

        role = new Role();

        role.is_active = true;
        role.name = data.name;
        role.updated_at = null;
        role.created_at = new Date();
        role.unique_id = AppUtils.getUniqueId();

        if (data.permissions) {
            for (let permission of data.permissions) {
                role.permissions.push(permission);
            }
        } else {
            data.permissions = [];
        }

        try {
            return await Role.create(role);
        } catch (error) {
            LoggerService.log('error', { error: error, message: 'Cannot create role', location: 'role-serv => store' });
            throw error;
        }
    }

    async update(id: any, data: any, headers: any = null) {
        let role: any = await this.findRecord(id);

        if (role) {
            let roleDataToUpdate = this.getUpdatedRole(role, data);
            return await Role.updateOne({ _id: id }, roleDataToUpdate);
        } else {
            return null;
        }
    }

    getUpdatedRole(role: IRole, data: any) {
        let roleDataToUpdate: any = {};

        if (data.hasOwnProperty('name')) roleDataToUpdate.name = data.name;
        if (data.hasOwnProperty('is_active')) roleDataToUpdate.is_active = data.is_active;
        if (data.hasOwnProperty('is_deleted')) roleDataToUpdate.is_deleted = data.is_deleted;
        if (data.hasOwnProperty('description')) roleDataToUpdate.description = data.description;
        if (data.hasOwnProperty('permissions')) roleDataToUpdate.permissions = data.permissions;

        return roleDataToUpdate;
    }

    async assign(data: any, headers: any = null) {
        let role: any = await this.findRecord(data._id);

        if (role) {
            let roleToUpdate = this.getUpdatedRole(role, data);

            roleToUpdate.permissions = data.permissions;

            return await Role.updateOne({ _id: data._id }, roleToUpdate);
        } else {
            return null;
        }
    }

    async getPermissionByRoleByModule(roleId: string, module: string) {
        let role: any = await this.findOne(roleId);

        if (role && role.permissions) {
            let permissions: any = [];

            for (let permission of role.permissions) {
                if (permission.module == module) {
                    permissions.push(permission);
                }
            }

            return permissions;
        } else {
            return null;
        }
    }

    async removePermission(data: any) {
        let role: any = await this.findOne(data.roleId);

        if (role && role.permissions) {
            let permissions: any = [];

            for (let permission of role.permissions) {
                if (permission._id != data.id) {
                    permissions.push(permission);
                }
            }

            role.permissions = permissions;

            return await Role.updateOne({ _id: role._id }, role);
        } else {
            return null;
        }
    }

    async remove(id: any, headers: any = null) {
        let role = await Role.findOne({ _id: id });
        if (role) {
            return await Role.updateOne({ _id: id }, { is_active: false, updated_at: new Date() });
        } else {
            return null;
        }
    }
}