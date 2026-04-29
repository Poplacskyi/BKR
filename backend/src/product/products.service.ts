// src/product/products.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    userId: number,
  ): Promise<Product> {
    // Перевіряємо, чи немає ТАКОГО Ж артикула У ЦЬОГО користувача
    const existingProduct = await this.productsRepository.findOne({
      where: { sku: createProductDto.sku, userId },
    });

    if (existingProduct) {
      throw new ConflictException(
        `Товар з артикулом ${createProductDto.sku} вже існує у вашому списку`,
      );
    }

    const newProduct = this.productsRepository.create({
      ...createProductDto,
      userId, // Прив'язуємо до юзера
    });
    return this.productsRepository.save(newProduct);
  }

  async findAll(userId: number): Promise<Product[]> {
    return this.productsRepository.find({
      where: { userId }, // Тільки товари цього юзера
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id, userId }, // Шукаємо за ID та належністю до юзера
    });

    if (!product) {
      throw new NotFoundException(`Товар не знайдено`);
    }
    return product;
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
    userId: number,
  ): Promise<Product> {
    const product = await this.findOne(id, userId);

    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingSku = await this.productsRepository.findOne({
        where: { sku: updateProductDto.sku, userId },
      });
      if (existingSku) {
        throw new ConflictException(
          `Артикул ${updateProductDto.sku} вже використовується`,
        );
      }
    }

    Object.assign(product, updateProductDto);
    return this.productsRepository.save(product);
  }

  async remove(id: number, userId: number): Promise<{ message: string }> {
    const product = await this.findOne(id, userId);
    await this.productsRepository.remove(product);
    return { message: `Товар успішно видалено` };
  }
}
