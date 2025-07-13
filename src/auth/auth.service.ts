import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { 
  SignUpDto, 
  SendOtpDto, 
  VerifyOtpDto, 
  ForgotPasswordDto, 
  ChangePasswordDto, 
  LoginDto, 
  AuthResponseDto 
} from './dto/auth.dto';
import { Types } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<{ message: string; mobileNumber: string }> {
    const { mobileNumber, email, username, password } = signUpDto;

    // Check if user already exists
    const existingUser = await this.userService.findByMobileNumber(mobileNumber);
    if (existingUser) {
      throw new ConflictException('User with this mobile number already exists');
    }

    // Check email uniqueness if provided
    if (email) {
      const existingEmailUser = await this.userService.findByEmail(email);
      if (existingEmailUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Create new user
    await this.userService.create(mobileNumber, email, username, password);

    return {
      message: 'User registered successfully. Please verify your mobile number with OTP.',
      mobileNumber,
    };
  }

  async sendOtp(sendOtpDto: SendOtpDto): Promise<{ message: string; otp: string }> {
    const { mobileNumber } = sendOtpDto;

    // Find or create user
    let user = await this.userService.findByMobileNumber(mobileNumber);
    if (!user) {
      // Create user if doesn't exist (for login via OTP)
      user = await this.userService.create(mobileNumber);
    }

    // Generate OTP
    const otp = await this.userService.generateOtp();
    
    // Save OTP to user
    await this.userService.saveOtp(mobileNumber, otp);

    // Console log for development
    console.log(`🔑 OTP Generated for ${mobileNumber}: ${otp}`);

    // In a real application, you would send this via SMS
    // For demo purposes, we return it in the response
    return {
      message: 'OTP sent successfully',
      otp, // Remove this in production
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<AuthResponseDto> {
    const { mobileNumber, otp } = verifyOtpDto;

    // Verify OTP
    const isValidOtp = await this.userService.verifyOtp(mobileNumber, otp);
    if (!isValidOtp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Mark user as verified
    await this.userService.markAsVerified(mobileNumber);

    // Get updated user
    const user = await this.userService.findByMobileNumber(mobileNumber);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate JWT token
    const payload = { 
      sub: (user._id as Types.ObjectId).toString(), 
      mobileNumber: user.mobileNumber 
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: (user._id as Types.ObjectId).toString(),
        mobileNumber: user.mobileNumber,
        email: user.email,
        username: user.username,
        subscriptionTier: user.subscriptionTier,
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string; otp: string }> {
    const { mobileNumber } = forgotPasswordDto;

    const user = await this.userService.findByMobileNumber(mobileNumber);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate OTP for password reset
    const otp = await this.userService.generateOtp();
    await this.userService.saveOtp(mobileNumber, otp);

    return {
      message: 'Password reset OTP sent successfully',
      otp, // Remove this in production
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    await this.userService.changePassword(
      userId, 
      changePasswordDto.currentPassword, 
      changePasswordDto.newPassword
    );

    return { message: 'Password changed successfully' };
  }

  // Keep legacy login for users who have email/password
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password
    if (!user.password) {
      throw new UnauthorizedException('Please use OTP login for this account');
    }

    const isPasswordValid = await this.userService.validatePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = { 
      sub: (user._id as Types.ObjectId).toString(), 
      mobileNumber: user.mobileNumber 
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: (user._id as Types.ObjectId).toString(),
        mobileNumber: user.mobileNumber,
        email: user.email,
        username: user.username,
        subscriptionTier: user.subscriptionTier,
      },
    };
  }

  async validateUser(id: string) {
    return this.userService.findById(id);
  }
}
