import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeadlineStatus } from '@prisma/client';

export class UpdateDeliveryStateDto {
  @ApiProperty({
    enum: DeadlineStatus,
    description: 'New status for the deadline',
  })
  @IsEnum(DeadlineStatus)
  status: DeadlineStatus;

  @ApiPropertyOptional({ description: 'Optional observation or comment' })
  @IsString()
  @IsOptional()
  observation?: string;

  @ApiPropertyOptional({
    description: 'Optional URL to the delivery receipt or evidence',
  })
  @IsUrl()
  @IsOptional()
  evidenceUrl?: string;
}
