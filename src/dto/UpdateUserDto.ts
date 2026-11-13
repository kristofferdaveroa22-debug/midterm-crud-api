
export interface UpdateUserDto {
    name?: string;
    email?: string;
    password?: string;
    phoneNumber?: string | null;
    isActive?: boolean;
}
