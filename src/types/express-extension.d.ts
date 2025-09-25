// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Express } from "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Response<ResponseType = unknown> {
    responsesFunc: IResponsesFunctions<ResponseType>;
  }

  interface IResponsesFunctions<ResponseType = unknown> {
    sendFileResponse(
      content: string,
      fileName: string,
      fileExtension: string,
      mimetype: string
    ): void;
    sendOkResponse(data: ResponseType, message?: string): void;
    sendCreatedResponse(data: ResponseType, message?: string): void;
    sendAcceptedResponse(data: ResponseType, message?: string): void;
    sendNoContentResponse(): void;

    sendBadRequestResponse(message?: string): void;
    sendUnauthorizedResponse(message?: string): void;
    sendForbiddenResponse(message?: string): void;
    sendNotFoundResponse(message?: string): void;
    sendConflictResponse(message?: string): void;
    sendUnprocessableEntityResponse(message?: string): void;
    sendInternalServerErrorResponse(message?: string): void;
  }
}

// // === EXPLICATION : Pourquoi Pick perd les types génériques ===

// // ❌ PROBLÈME : Objet littéral imbriqué
// interface ResponseBroken<ResponseType> {
//   responsesFunc: {
//     // Cet objet littéral "capture" ResponseType de manière statique
//     sendOkResponse(data: ResponseType, message?: string): void;
//   };
// }

// // Quand TypeScript évalue Pick<ResponseBroken<T>["responsesFunc"], "sendOkResponse">
// // Il fait ça en plusieurs étapes :

// // Étape 1: Il résout ResponseBroken<T>["responsesFunc"]
// // Résultat : { sendOkResponse(data: ResponseType, message?: string): void }
// // ⚠️ À ce stade, "ResponseType" devient une référence "flottante"

// // Étape 2: Il applique Pick<..., "sendOkResponse">
// // Résultat : { sendOkResponse: (data: ResponseType, message?: string) => void }
// // ❌ Mais TypeScript ne sait plus à quel "ResponseType" se référer !

// // === ✅ SOLUTION : Interface nommée séparée ===

// interface ResponseFunctions<ResponseType> {
//   sendOkResponse(data: ResponseType, message?: string): void;
// }

// interface ResponseWorking<ResponseType> {
//   responsesFunc: ResponseFunctions<ResponseType>;
// }

// // Quand TypeScript évalue Pick<ResponseFunctions<T>, "sendOkResponse">
// // Il garde la liaison avec le type générique T !

// // === DÉMONSTRATION CONCRÈTE ===

// // Test avec l'approche cassée
// type BrokenPick<T> = Pick<ResponseBroken<T>["responsesFunc"], "sendOkResponse">;
// type TestBroken = BrokenPick<{name: string}>;
// // TestBroken = { sendOkResponse: (data: any, message?: string) => void }
// // ❌ Le type {name: string} est perdu !

// // Test avec l'approche qui fonctionne
// type WorkingPick<T> = Pick<ResponseFunctions<T>, "sendOkResponse">;
// type TestWorking = WorkingPick<{name: string}>;
// // TestWorking = { sendOkResponse: (data: {name: string}, message?: string) => void }
// // ✅ Le type {name: string} est préservé !

// // === EXPLICATION TECHNIQUE DÉTAILLÉE ===

// // 1. Résolution de type par TypeScript

// // Cas cassé:
// // Response<T>["responsesFunc"] → { sendOkResponse(data: T): void }
// // La propriété indexée "déconnecte" le T du contexte original
// // Pick<..., "sendOkResponse"> → sendOkResponse devient orphelin de son T

// // Cas qui fonctionne:
// // ResponseFunctions<T> → Interface avec T toujours "attaché"
// // Pick<ResponseFunctions<T>, "sendOkResponse"> → T reste connecté

// // === EXEMPLE SIMPLIFIÉ POUR COMPRENDRE ===

// // ❌ Problème similaire
// interface Container<T> {
//   data: {
//     value: T;
//   };
// }

// type ExtractValue<T> = Container<T>["data"]["value"];
// type Test1 = ExtractValue<string>; // ✅ Fonctionne : string

// // Mais si on fait ça :
// type ExtractContainer<T> = Container<T>["data"];
// type ExtractFromContainer<T> = Pick<ExtractContainer<T>, "value">;
// type Test2 = ExtractFromContainer<string>; // ❌ value: any

// // ✅ Solution
// interface DataInterface<T> {
//   value: T;
// }

// interface ContainerFixed<T> {
//   data: DataInterface<T>;
// }

// type ExtractFromFixed<T> = Pick<DataInterface<T>, "value">;
// type Test3 = ExtractFromFixed<string>; // ✅ value: string

// // === RÈGLE GÉNÉRALE ===

// // ❌ Éviter : Pick sur des propriétés indexées avec génériques
// // Pick<SomeInterface<T>["nestedObject"], "method">

// // ✅ Préférer : Pick sur des interfaces nommées avec génériques
// // Pick<NamedInterface<T>, "method">

// // === POURQUOI CETTE DIFFÉRENCE ? ===

// /*
// Quand TypeScript voit :
// Response<T>["responsesFunc"]

// Il traite ça comme :
// 1. Prendre Response<T>
// 2. Extraire la propriété "responsesFunc"
// 3. Le résultat est un nouvel objet type SANS contexte du T original

// Quand TypeScript voit :
// ResponseFunctions<T>

// Il traite ça comme :
// 1. Une référence DIRECTE à l'interface avec son paramètre T intact
// 2. Le T reste "vivant" et utilisable

// C'est pourquoi les interfaces nommées préservent les génériques
// alors que les accès par propriété les "cassent".
// */

// // === AUTRES EXEMPLES QUI ILLUSTRENT LE PRINCIPE ===

// // ❌ Cassé
// interface Parent<T> {
//   child: {
//     process: (item: T) => void;
//   };
// }
// type BrokenChild<T> = Pick<Parent<T>["child"], "process">;

// // ✅ Fonctionne
// interface Child<T> {
//   process: (item: T) => void;
// }
// interface ParentFixed<T> {
//   child: Child<T>;
// }
// type WorkingChild<T> = Pick<Child<T>, "process">;

// // Test final
// type TestChild1 = BrokenChild<number>; // process: (item: any) => void ❌
// type TestChild2 = WorkingChild<number>; // process: (item: number) => void ✅
