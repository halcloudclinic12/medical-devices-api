export class UserDTO {
    role: any;
    _id: string;
    email: string;
    gender: string;
    mobile: string;
    role_id: string;
    username: string;
    last_name: string;
    user_type: string;
    first_name: string;
    image_file: string;
    date_of_birth: Date;
    customer_id: string;
    creator_user_id: string;

    is_active: boolean;
    is_customer: boolean;
    belongs_to_customer: boolean;

    constructor(user: any) {
        this._id = user._id;
        this.role = user.role;
        this.email = user.email;
        this.gender = user.gender;
        this.mobile = user.mobile;
        this.role_id = user.role_id;
        this.username = user.username;
        this.is_active = user.is_active;
        this.last_name = user.last_name;
        this.user_type = user.user_type;
        this.first_name = user.first_name;
        this.image_file = user.image_file;
        this.customer_id = user.customer_id;
        this.is_customer = user.is_customer;
        this.date_of_birth = user.date_of_birth;
        this.creator_user_id = user.creator_user_id;
        this.belongs_to_customer = user.belongs_to_customer;
    }
}
