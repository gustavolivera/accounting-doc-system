import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaxRegime, ActivityType } from '@prisma/client';

export class CreateCompanyDto {
  @ApiProperty({ description: 'Internal unique code for the company' })
  @IsString()
  @IsOptional()
  internalCode?: string;

  @ApiProperty({ description: 'Corporate Name (Razão Social)' })
  @IsString()
  @IsNotEmpty()
  corporateName: string;

  @ApiProperty({ description: 'Trade Name (Nome Fantasia)' })
  @IsString()
  @IsNotEmpty()
  tradeName: string;

  @ApiProperty({ description: 'CNPJ (14 digits)' })
  @IsString()
  @IsNotEmpty()
  // Add custom CNPJ validation logic if needed, usually done in service or custom validator
  cnpj: string;

  @ApiPropertyOptional({ description: 'State Registration Number' })
  @IsString()
  @IsOptional()
  stateRegistration?: string;

  @ApiProperty({ description: 'Is Exempt from State Registration', default: false })
  @IsBoolean()
  @IsOptional()
  isExemptStateRegistration?: boolean;

  @ApiProperty({ description: 'City' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({ description: 'Fiscal Observations' })
  @IsString()
  @IsOptional()
  fiscalObservations?: string;

  @ApiPropertyOptional({ enum: TaxRegime, description: 'Tax Regime' })
  @IsEnum(TaxRegime)
  @IsOptional()
  taxRegime?: TaxRegime;

  @ApiProperty({ enum: ActivityType, isArray: true, description: 'List of Activities' })
  @IsArray()
  @IsEnum(ActivityType, { each: true })
  @IsOptional()
  activities?: ActivityType[];

  // Movement Booleans
  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  hasMovement?: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  hasOutboundDocs?: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  hasInboundDocs?: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  hasServiceDocs?: boolean;

  // Tax Booleans
  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  taxSimplesNacional?: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  taxIss?: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  taxIcms?: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  taxPis?: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  taxCofins?: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  taxIrpj?: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  taxCsll?: boolean;

  // Obligation Booleans
  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  obFima?: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  obSintegra?: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  obSpedIcms?: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  obEfdContribuicoes?: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  obDctfWeb?: boolean;
}
