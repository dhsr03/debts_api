import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
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
    if (!user) throw new UnauthorizedException('Credenciales incorrectas, por favor verifica e intenta de nuevo.');
    const payload = { email: user.email, sub: user.id };
    return this.jwtService.sign(payload);
  }

  async register(createDto: CreateUserDto) {
    const existingUser = await this.usersService.findByEmail(
      createDto.email,
    );

    if (existingUser) {
      throw new ConflictException(
        'Ya existe un usuario registrado con este correo electrónico',
      );
    }

    const hash = await bcrypt.hash(createDto.password, 10);

    const user = await this.usersService.create({
      ...createDto,
      password: hash,
    });

    const { password, ...result } = user;
    return result;
  }
}