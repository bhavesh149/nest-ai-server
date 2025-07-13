import { Controller, Post, Body, ValidationPipe, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { 
  SignUpDto, 
  SendOtpDto, 
  VerifyOtpDto, 
  ForgotPasswordDto, 
  ChangePasswordDto, 
  LoginDto, 
  AuthResponseDto 
} from './dto/auth.dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('signup')
  async signUp(@Body(ValidationPipe) signUpDto: SignUpDto): Promise<{ message: string; mobileNumber: string }> {
    return this.authService.signUp(signUpDto);
  }

  @Public()
  @Post('send-otp')
  async sendOtp(@Body(ValidationPipe) sendOtpDto: SendOtpDto): Promise<{ message: string; otp: string }> {
    return this.authService.sendOtp(sendOtpDto);
  }

  @Public()
  @Post('verify-otp')
  async verifyOtp(@Body(ValidationPipe) verifyOtpDto: VerifyOtpDto): Promise<AuthResponseDto> {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string; otp: string }> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Request() req: any,
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto
  ): Promise<{ message: string }> {
    return this.authService.changePassword(req.user.id, changePasswordDto);
  }

  // Keep legacy login for backward compatibility
  @Public()
  @Post('login')
  async login(@Body(ValidationPipe) loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }
}
