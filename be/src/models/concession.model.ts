import mongoose, { Document, Schema } from 'mongoose';

export const CONCESSION_CATEGORIES = ['Comida', 'Bebida', 'Merchandising'] as const;
export type ConcessionCategory = (typeof CONCESSION_CATEGORIES)[number];

export interface IConcession extends Document {
  name: string;
  description?: string;
  category: ConcessionCategory;
  price: number;
  stock: number;
  imageUrl?: string;
  imagePublicId?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const concessionSchema = new Schema<IConcession>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, enum: CONCESSION_CATEGORIES, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export const Concession = mongoose.model<IConcession>('Concession', concessionSchema);
