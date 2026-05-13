// src/products/dto/update-product.dto.ts
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  askPrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  bidPrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;
}
