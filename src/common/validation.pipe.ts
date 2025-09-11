// src/common/validation.pipe.ts
import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || [String, Boolean, Number, Array, Object].includes(metatype as any)) return value;
    const object = plainToInstance(metatype, value);
    const errors = await validate(object, { whitelist: true, forbidNonWhitelisted: true });
    if (errors.length) throw new BadRequestException(errors);
    return object;
  }
}
