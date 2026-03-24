import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return { name: 'MealPlan API', version: '1.0', docs: '/api-docs' };
  }

  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
