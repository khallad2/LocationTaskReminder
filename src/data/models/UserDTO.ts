import { User } from '../../domain/entities/User';

/**
 * UserDTO — Maps Firebase Auth user to domain User entity.
 */
export interface UserDTO {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

export function toUser(dto: UserDTO): User {
  return {
    uid: dto.uid,
    email: dto.email,
    displayName: dto.displayName,
    photoURL: dto.photoURL,
    isAnonymous: dto.isAnonymous,
  };
}
