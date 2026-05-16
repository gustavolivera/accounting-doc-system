import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  ValidateNested,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DeadlineType, Periodicity, ConditionOperator } from '@prisma/client';

class ObligationConditionDto {
  @ApiProperty({ description: 'Field field name in Company model' })
  @IsString()
  @IsNotEmpty()
  field: string;

  @ApiProperty({ enum: ConditionOperator })
  @IsEnum(ConditionOperator)
  operator: ConditionOperator;

  @ApiProperty({ description: 'Value to compare' })
  @IsString()
  @IsNotEmpty()
  value: string;
}

export class CreateObligationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: DeadlineType })
  @IsEnum(DeadlineType)
  type: DeadlineType;

  @ApiProperty({ enum: Periodicity })
  @IsEnum(Periodicity)
  periodicity: Periodicity;

  @ApiProperty({ description: 'Fixed day of month for due date (1-31)' })
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay: number;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    type: [ObligationConditionDto],
    description: 'List of conditions',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ObligationConditionDto)
  @IsOptional()
  conditions?: ObligationConditionDto[];
}
