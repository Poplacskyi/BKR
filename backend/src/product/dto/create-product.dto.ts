// src/products/dto/create-product.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: "Назва товару є обов'язковою" })
  name: string;

  @IsString()
  @IsNotEmpty({ message: "Артикул (SKU) є обов'язковим" })
  sku: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @Min(0, { message: "Ціна не може бути від'ємною" })
  askPrice: number;

  @IsNumber()
  @Min(0, { message: "Ціна не може бути від'ємною" })
  bidPrice: number;

  @IsNumber()
  @Min(0, { message: "Кількість на складі не може бути від'ємною" })
  stock: number;
}
