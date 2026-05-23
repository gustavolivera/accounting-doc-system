import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaxRegime, ActivityType } from '@prisma/client';
import { IsCnpj } from './is-cnpj.validator';
export class CreateCompanyDto {
  @ApiProperty({ description: 'Internal unique code for the company' })
  @IsString()
  @IsOptional()
  internalCode?: string;

  @ApiProperty({ description: 'Corporate Name (Razão Social)' })
  @IsString({ message: 'A Razão Social deve ser um texto' })
  @IsNotEmpty({ message: 'A Razão Social é obrigatória' })
  corporateName: string;

  @ApiProperty({ description: 'Trade Name (Nome Fantasia)' })
  @IsString({ message: 'O Nome Fantasia deve ser um texto' })
  @IsNotEmpty({ message: 'O Nome Fantasia é obrigatório' })
  tradeName: string;

  @ApiProperty({ description: 'CNPJ (14 digits)' })
  @IsString({ message: 'O CNPJ deve ser um texto' })
  @IsNotEmpty({ message: 'O CNPJ é obrigatório' })
  @IsCnpj({ message: 'O CNPJ informado não é válido' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/\D/g, '') : value,
  )
  cnpj: string;

  @ApiPropertyOptional({ description: 'State Registration Number' })
  @IsString()
  @IsOptional()
  stateRegistration?: string;

  @ApiProperty({
    description: 'Is Exempt from State Registration',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isExemptStateRegistration?: boolean;

  @ApiProperty({ description: 'City' })
  @IsString({ message: 'O Município deve ser um texto' })
  @IsNotEmpty({ message: 'O Município é obrigatório' })
  city: string;

  @ApiPropertyOptional({ description: 'Fiscal Observations' })
  @IsString()
  @IsOptional()
  fiscalObservations?: string;

  @ApiPropertyOptional({ enum: TaxRegime, description: 'Tax Regime' })
  @IsEnum(TaxRegime)
  @IsOptional()
  taxRegime?: TaxRegime;

  @ApiProperty({
    enum: ActivityType,
    isArray: true,
    description: 'List of Activities',
  })
  @IsArray()
  @IsEnum(ActivityType, { each: true })
  @IsOptional()
  activities?: ActivityType[];

  @ApiPropertyOptional({
    description: 'Fiscal Parameters key-value pairs',
    example: { hasMovement: 'true', taxIss: 'false' },
  })
  @IsOptional()
  fiscalParameters?: Record<string, string>;
}
