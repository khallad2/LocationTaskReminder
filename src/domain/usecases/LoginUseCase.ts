import { User } from '../entities/User';
import { IAuthRepository } from '../repositories/IAuthRepository';

/**
 * LoginUseCase — Handles email/password sign-in.
 */
export class LoginUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(email: string, password: string): Promise<User> {
    return this.authRepository.signInWithEmail(email, password);
  }
}

/**
 * RegisterUseCase — Handles email/password sign-up.
 */
export class RegisterUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(email: string, password: string): Promise<User> {
    return this.authRepository.signUpWithEmail(email, password);
  }
}
