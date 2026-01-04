import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateDebtDto {
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @Min(0)
  amount: number;
}
