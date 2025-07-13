import { IsEmail, IsOptional, IsString, MinLength, Matches, Length } from 'class-validator';

export class SignUpDto {
  @IsString()
  @Matches(/^[+]?[1-9]\d{1,14}$/, { 
    message: 'Mobile number must be valid international format' 
  })
  mobileNumber: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string;
}

export class SendOtpDto {
  @IsString()
  @Matches(/^[+]?[1-9]\d{1,14}$/, { 
    message: 'Mobile number must be valid international format' 
  })
  mobileNumber: string;
}

export class VerifyOtpDto {
  @IsString()
  @Matches(/^[+]?[1-9]\d{1,14}$/, { 
    message: 'Mobile number must be valid international format' 
  })
  mobileNumber: string;

  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp: string;
}

export class ForgotPasswordDto {
  @IsString()
  @Matches(/^[+]?[1-9]\d{1,14}$/, { 
    message: 'Mobile number must be valid international format' 
  })
  mobileNumber: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class AuthResponseDto {
  access_token: string;
  user: {
    id: string;
    mobileNumber: string;
    email?: string;
    username?: string;
    subscriptionTier: string;
  };
}
