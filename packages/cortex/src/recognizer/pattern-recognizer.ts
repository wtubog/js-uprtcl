import { injectable } from 'inversify';

import { Pattern } from '../types/pattern';
import { Behaviour } from 'src/types/behaviour';
import { Entity } from 'src/types/entity';

@injectable()
export class PatternRecognizer {
  patterns!: Pattern<any>[];

  /**
   * Recognizes which registered patterns match the given object
   * @param object 
   */
  public recognize<T>(object: T): Pattern<T>[] {
    if (!object) {
      throw new Error('The given object was not defined');
    }

    const recognizedPatterns = this.patterns
      .filter(pattern => pattern.recognize(object))
      .map(p => ({ ...p }));

    return recognizedPatterns as Pattern<T>[];
  }

  /**
   * Recognizes all behaviours for the given object, flattening the array
   * 
   * @param object object for which to recognize the behaviour
   */
  public recognizeBehaviours<T>(object: T): Behaviour<T>[] {
    const patterns: Pattern<T>[] = this.recognize(object);

    return patterns.map(p => p.behaviours);
  }

  /**
   * Recognizes the type of the given entity
   * 
   * @param entity to recognize the type for
   * @throws error if no pattern recognized the given entity
   * @throws error if two patterns with different types recognized the given entity
   */
  public recognizeEntityType<T>(entity: Entity<T>): string {
    const patterns: Pattern<Entity<T>>[] = this.recognize(entity);

    const types: string[] = patterns.map(p => p.type).filter(t => !!t) as string[];

    if (types.length === 0) {
      throw new Error(`No entity found to recognize object ${JSON.stringify(entity)}`);
    }

    const abmiguousError = types.length > 1 && !types.every(t => types[0]);

    if (abmiguousError) {
      throw new Error(
        `Ambiguous error recognizing entity: ${parent.toString()}. These two types recognized the object ${types.toString()}`
      );
    }

    return types[0];
  }
}
