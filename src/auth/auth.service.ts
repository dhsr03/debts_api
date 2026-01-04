import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(email: string, pass: string): Promise<string> {
    const user = await this.validateUser(email, pass);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const payload = { email: user.email, sub: user.id };
    return this.jwtService.sign(payload);
  }

  async register(createDto: CreateUserDto) {
    const hash = await bcrypt.hash(createDto.password, 10);
    const user = await this.usersService.create({ ...createDto, password: hash });
    const { password, ...result } = user;
    return result;
  }
}