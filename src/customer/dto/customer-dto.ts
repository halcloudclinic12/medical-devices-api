export class UserDTO {
    _id: string;
    email: string;
    gender: string;
    mobile: string;
    username: string;
    last_name: string;
    first_name: string;
    image_file: string;
    date_of_birth: Date;
    is_active: boolean;

    constructor(user: any) {
        this._id = user._id;
        this.email = user.email;
        this.gender = user.gender;
        this.mobile = user.mobile;
        this.username = user.username;
        this.last_name = user.last_name;
        this.first_name = user.first_name;
        this.image_file = user.image_file;
        this.date_of_birth = user.date_of_birth;
        this.is_active = user.is_active;
    }
}
