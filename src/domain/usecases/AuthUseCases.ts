import { IAuthRepository } from '../repositories/IAuthRepository';
import { User } from '../entities/User';

export class SignInWithGoogleUseCase {
  constructor(private authRepository: IAuthRepository) {}
  async execute(): Promise<User> {
    return this.authRepository.signInWithGoogle();
  }
}

export class SignInAnonymouslyUseCase {
  constructor(private authRepository: IAuthRepository) {}
  async execute(): Promise<User> {
    return this.authRepository.signInAnonymously();
  }
}

export class SignOutUseCase {
  constructor(private authRepository: IAuthRepository) {}
  async execute(): Promise<void> {
    return this.authRepository.signOut();
  }
}

export class SubscribeToAuthStateUseCase {
  constructor(private authRepository: IAuthRepository) {}
  execute(callback: (user: User | null) => void): () => void {
    return this.authRepository.onAuthStateChanged(callback);
  }
}
