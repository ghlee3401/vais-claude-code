/**
 * src/example/__tests__/service.test.js — 서비스 단위 테스트
 *
 * DB mock 금지 — repository는 실제 모듈(인메모리) 사용
 */

'use strict';

const service = require('../service');

describe('example service', () => {
  describe('create', () => {
    it('유효한 데이터로 항목을 생성한다', async () => {
      const result = await service.create({ name: 'test', value: 42 });

      expect(result.id).toBeDefined();
      expect(result.name).toBe('test');
      expect(result.value).toBe(42);
      expect(result.createdAt).toBeDefined();
    });

    it('name이 없으면 에러를 던진다', async () => {
      await expect(service.create({ value: 1 })).rejects.toThrow('VALIDATION_ERROR');
    });

    it('value가 숫자가 아니면 에러를 던진다', async () => {
      await expect(service.create({ name: 'test', value: 'not-a-number' })).rejects.toThrow('VALIDATION_ERROR');
    });
  });

  describe('findById', () => {
    it('생성된 항목을 ID로 조회한다', async () => {
      const created = await service.create({ name: 'find-me', value: 99 });
      const found = await service.findById(created.id);

      expect(found).toEqual(created);
    });

    it('존재하지 않는 ID는 null을 반환한다', async () => {
      const result = await service.findById('non-existent-id');
      expect(result).toBeNull();
    });

    it('id가 없으면 에러를 던진다', async () => {
      await expect(service.findById('')).rejects.toThrow('VALIDATION_ERROR');
    });
  });
});
