import { IsNumber, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateDeadlinesDto {
  @ApiPropertyOptional({
    description:
      'The year for which to generate deadlines. Defaults to current year.',
  })
  @IsNumber()
  @IsOptional()
  year?: number;
}
