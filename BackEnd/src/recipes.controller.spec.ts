import { Test } from '@nestjs/testing';
import { RecipesController } from './recipes.controller';
import { DataSource } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recipe } from './recipe.entity';
import { RecipeIngredient } from './recipe-ingredient.entity';
import { Beverage } from './beverage.entity';
import { RecipesModule } from './recipes.module';
import { RecipesServiceImpl } from './recipes.service.impl';
import { BeveragesController } from './beverages.controller';
import { BeveragesServiceImpl } from './beverages.service.impl';
import { TypeOrmExModule } from './typeorm-ex.module';
import { BeveragesRepository } from './beverages.repository';
import { RecipesRepository } from './recipes.repository';
import { BeveragesModule } from './beverages.module';

describe('RecipesController', () => {
  let recipesController: RecipesController;
  let beveragesController: BeveragesController;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: 'localhost',
          port: 3306,
          username: 'ssafy',
          password: 'ssafy',
          database: 'ssafy_project_test',
          entities: [Beverage, Recipe, RecipeIngredient],
          synchronize: false,
          timezone: '+09:00',
          charset: 'utf8mb4',
          logging: true,
        }),
        RecipesModule,
        BeveragesModule,
        TypeOrmExModule.forCustomRepository([BeveragesRepository, RecipesRepository]),
      ],
      controllers: [RecipesController, BeveragesController],
      providers: [RecipesServiceImpl, BeveragesServiceImpl],
    }).compile();
    recipesController = moduleRef.get<RecipesController>(RecipesController);
    beveragesController = moduleRef.get<BeveragesController>(BeveragesController);
    dataSource = moduleRef.get<DataSource>(DataSource);
    dataSource.createEntityManager;
  });

  afterAll(async () => {
    dataSource.destroy();
  });
  beforeEach(async () => {
    const entities = dataSource.entityMetadatas;

    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.clear();
    }
  });

  it('should be defined', () => {
    expect(RecipesController).toBeDefined();
  });

  it('recipe create 테스트', async () => {
    const b1: Beverage = {
      beverage_name: '드래곤의피',
      beverage_id: undefined,
      beverage_image_url: undefined,
    };
    const b2: Beverage = {
      beverage_name: '피닉스의눈물',
      beverage_id: undefined,
      beverage_image_url: undefined,
    };
    const b3: Beverage = {
      beverage_name: '봉황의정수',
      beverage_id: undefined,
      beverage_image_url: undefined,
    };
    const b4: Beverage = {
      beverage_name: '사악한기운의액체',
      beverage_id: undefined,
      beverage_image_url: undefined,
    };

    await beveragesController.post(b1);
    await beveragesController.post(b2);
    await beveragesController.post(b3);
    await beveragesController.post(b4);

    const resultBeverage = await beveragesController.getAll();
    expect(resultBeverage.items.length).toEqual(4);

    const ingredients: RecipeIngredient[] = [];
    const ingredients2: RecipeIngredient[] = [];
    const filter: number[] = [];

    for (const item of resultBeverage.items) {
      switch (item.beverage_name) {
        case '드래곤의피':
          ingredients.push({
            beverage_id: item.beverage_id,
            recipe_ingredient_ratio: 3,
            recipe: undefined,
            recipe_id: undefined,
          });
          ingredients2.push({
            beverage_id: item.beverage_id,
            recipe_ingredient_ratio: 10,
            recipe: undefined,
            recipe_id: undefined,
          });
          filter.push(item.beverage_id);
          break;
        case '피닉스의눈물':
          ingredients.push({
            beverage_id: item.beverage_id,
            recipe_ingredient_ratio: 1,
            recipe: undefined,
            recipe_id: undefined,
          });
          filter.push(item.beverage_id);
          break;
        case '봉황의정수':
          ingredients.push({
            beverage_id: item.beverage_id,
            recipe_ingredient_ratio: 1,
            recipe: undefined,
            recipe_id: undefined,
          });
          filter.push(item.beverage_id);
          break;
        case '사악한기운의액체':
          ingredients2.push({
            beverage_id: item.beverage_id,
            recipe_ingredient_ratio: 3,
            recipe: undefined,
            recipe_id: undefined,
          });
          filter.push(item.beverage_id);
          break;
      }
    }

    expect(ingredients.length).toEqual(3);

    const r1: Recipe = {
      recipe_name: '사악한마력의엘릭서',
      recipe_id: undefined,
      recipe_desc: '사악한 기운을 뿜고 있는 엘릭서이다.',
      recipe_use_count: undefined,
      ingredients: ingredients,
    };
    const r2: Recipe = {
      recipe_name: '악한드래곤의피',
      recipe_id: undefined,
      recipe_desc: '악한 기운이 깃든 드래곤의 피이다.',
      recipe_use_count: undefined,
      ingredients: ingredients2,
    };

    await recipesController.post(r1);
    await recipesController.post(r2);

    const result = await recipesController.getAll(1, 10, filter, '', 'name');
    expect(result.items.length).toEqual(2);

    expect(result.items[0].recipe_name).toEqual('사악한마력의엘릭서');

    expect(result.items[0].recipe_use_count).toEqual(0);

    expect(result.items[0].ingredients.length).toEqual(3);
  });
});
