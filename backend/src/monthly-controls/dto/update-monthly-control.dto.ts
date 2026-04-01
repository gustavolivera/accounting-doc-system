import { PartialType } from '@nestjs/swagger';
import { CreateMonthlyControlDto } from './create-monthly-control.dto';

export class UpdateMonthlyControlDto extends PartialType(CreateMonthlyControlDto) {}
