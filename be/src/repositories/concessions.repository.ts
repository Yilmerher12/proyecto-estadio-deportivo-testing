import { Concession, IConcession } from '../models/concession.model';
import type { CreateConcessionInput, UpdateConcessionInput } from '../validators/concessions.schema';

export async function findAll(userId: string): Promise<IConcession[]> {
  return Concession.find({ createdBy: userId }).sort({ createdAt: -1 });
}

// Sin populate: createdBy queda como ObjectId y sirve para comparar dueños.
export async function findById(id: string): Promise<IConcession | null> {
  return Concession.findById(id);
}

// Con populate: solo para mostrar quién creó la concesión.
export async function findByIdWithOwner(id: string): Promise<IConcession | null> {
  return Concession.findById(id).populate('createdBy', 'name email');
}

export async function create(
  data: CreateConcessionInput & {
    imageUrl?: string;
    imagePublicId?: string;
    createdBy: string;
  },
): Promise<IConcession> {
  return Concession.create(data);
}

export async function update(
  id: string,
  data: UpdateConcessionInput,
): Promise<IConcession | null> {
  return Concession.findByIdAndUpdate(id, data, { new: true, runValidators: true });
}

export async function updateImage(
  id: string,
  imageUrl: string,
  imagePublicId: string,
): Promise<IConcession | null> {
  return Concession.findByIdAndUpdate(id, { imageUrl, imagePublicId }, { new: true });
}

export async function remove(id: string): Promise<IConcession | null> {
  return Concession.findByIdAndDelete(id);
}
