import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as concessionsRepository from '../repositories/concessions.repository';
import * as usersRepository from '../repositories/users.repository';
import * as concessionsService from './concessions.service';
import { sendConcessionCreatedEmail } from './email.service';
import { deleteFromCloudinary, uploadToCloudinary } from './upload.service';

// Se simulan Mongo (repositorios), Cloudinary y el correo: aquí solo se prueba la regla.
vi.mock('../repositories/concessions.repository');
vi.mock('../repositories/users.repository');
vi.mock('./upload.service');
vi.mock('./email.service');

const concessions = vi.mocked(concessionsRepository);
const users = vi.mocked(usersRepository);

function fakeConcession(extra: Record<string, unknown> = {}) {
  return { _id: 'c1', name: 'Perro caliente', category: 'Comida', createdBy: 'u1', ...extra } as never;
}

const input = { name: 'Perro caliente', category: 'Comida' as const, price: 8000, stock: 50 };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(sendConcessionCreatedEmail).mockResolvedValue(undefined);
  vi.mocked(deleteFromCloudinary).mockResolvedValue(undefined);
});

describe('getById', () => {
  it('should respond 404 when the concession does not exist', async () => {
    // Arrange
    concessions.findByIdWithOwner.mockResolvedValue(null);

    // Act + Assert
    await expect(concessionsService.getById('c1')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('update', () => {
  it('should respond 404 when the concession does not exist', async () => {
    // Arrange
    concessions.findById.mockResolvedValue(null);

    // Act + Assert
    await expect(concessionsService.update('c1', 'u1', { price: 1 })).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('should respond 403 and not update when the user is not the owner', async () => {
    // Arrange
    concessions.findById.mockResolvedValue(fakeConcession({ createdBy: 'u2' }));

    // Act + Assert
    await expect(concessionsService.update('c1', 'u1', { price: 1 })).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(concessions.update).not.toHaveBeenCalled();
  });

  it('should update when the user is the owner', async () => {
    // Arrange
    const updated = fakeConcession({ price: 9000 });
    concessions.findById.mockResolvedValue(fakeConcession());
    concessions.update.mockResolvedValue(updated);

    // Act
    const result = await concessionsService.update('c1', 'u1', { price: 9000 });

    // Assert
    expect(concessions.update).toHaveBeenCalledWith('c1', { price: 9000 });
    expect(result).toBe(updated);
  });
});

describe('create', () => {
  it('should save the concession with the owner and email the user, without uploading an image', async () => {
    // Arrange
    concessions.create.mockResolvedValue(fakeConcession());
    users.findById.mockResolvedValue({ email: 'ana@example.com', name: 'Ana' } as never);

    // Act
    await concessionsService.create(input, 'u1');

    // Assert
    expect(uploadToCloudinary).not.toHaveBeenCalled();
    expect(concessions.create).toHaveBeenCalledWith(expect.objectContaining({ createdBy: 'u1' }));
    expect(sendConcessionCreatedEmail).toHaveBeenCalledWith(
      'ana@example.com',
      'Ana',
      'Perro caliente',
      'Comida',
    );
  });

  it('should save the url and the public id when an image is uploaded', async () => {
    // Arrange
    vi.mocked(uploadToCloudinary).mockResolvedValue({ url: 'https://img/1.png', publicId: 'p1' });
    concessions.create.mockResolvedValue(fakeConcession());
    users.findById.mockResolvedValue(null);
    const file = { buffer: Buffer.from('x') } as Express.Multer.File;

    // Act
    await concessionsService.create(input, 'u1', file);

    // Assert
    expect(concessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ imageUrl: 'https://img/1.png', imagePublicId: 'p1' }),
    );
    expect(sendConcessionCreatedEmail).not.toHaveBeenCalled();
  });
});

describe('updateImage', () => {
  const file = { buffer: Buffer.from('x') } as Express.Multer.File;

  it('should upload the new image first and then delete the old one', async () => {
    // Arrange
    concessions.findById.mockResolvedValue(fakeConcession({ imagePublicId: 'old' }));
    vi.mocked(uploadToCloudinary).mockResolvedValue({ url: 'https://img/2.png', publicId: 'new' });
    concessions.updateImage.mockResolvedValue(fakeConcession());

    // Act
    await concessionsService.updateImage('c1', 'u1', file);

    // Assert
    expect(concessions.updateImage).toHaveBeenCalledWith('c1', 'https://img/2.png', 'new');
    expect(deleteFromCloudinary).toHaveBeenCalledWith('old');
  });

  it('should still succeed when deleting the old image fails', async () => {
    // Arrange
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    concessions.findById.mockResolvedValue(fakeConcession({ imagePublicId: 'old' }));
    vi.mocked(uploadToCloudinary).mockResolvedValue({ url: 'https://img/2.png', publicId: 'new' });
    concessions.updateImage.mockResolvedValue(fakeConcession());
    vi.mocked(deleteFromCloudinary).mockRejectedValue(new Error('cloudinary caído'));

    // Act + Assert
    await expect(concessionsService.updateImage('c1', 'u1', file)).resolves.toBeDefined();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});

describe('remove', () => {
  it('should delete the image from Cloudinary and then the concession', async () => {
    // Arrange
    concessions.findById.mockResolvedValue(fakeConcession({ imagePublicId: 'img1' }));

    // Act
    await concessionsService.remove('c1', 'u1');

    // Assert
    expect(deleteFromCloudinary).toHaveBeenCalledWith('img1');
    expect(concessions.remove).toHaveBeenCalledWith('c1');
  });

  it('should not call Cloudinary when the concession has no image', async () => {
    // Arrange
    concessions.findById.mockResolvedValue(fakeConcession());

    // Act
    await concessionsService.remove('c1', 'u1');

    // Assert
    expect(deleteFromCloudinary).not.toHaveBeenCalled();
    expect(concessions.remove).toHaveBeenCalledWith('c1');
  });

  it('should respond 403 and not delete when the user is not the owner', async () => {
    // Arrange
    concessions.findById.mockResolvedValue(fakeConcession({ createdBy: 'u2' }));

    // Act + Assert
    await expect(concessionsService.remove('c1', 'u1')).rejects.toMatchObject({ statusCode: 403 });
    expect(concessions.remove).not.toHaveBeenCalled();
  });
});
