import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Location } from '@angular/common';

/**
 * Fonction de fabrique pour créer des resolvers génériques.
 * @param endpointPath La route de base de l'API (ex: '/api/sites').
 * @param paramName Le nom du paramètre dans la route (par défaut 'id').
 */
export function genericResolver<T = any>(endpointPath: string, paramName: string = 'id'): ResolveFn<T | null> {
    return (route) => {
        const http = inject(HttpClient);
        const router = inject(Router);
        const location = inject(Location);
        const messageService = inject(MessageService);
        const id = route.paramMap.get(paramName);

        if (!id) {
            router.navigate(['/']);
            return of(null);
        }

        return http.get<T>(`${endpointPath}/${id}`).pipe(
            catchError((error) => {
                console.error(`Erreur de résolution pour ${endpointPath}/${id}:`, error);

                const errorMessage = error.status === 404
                    ? "L'élément demandé est introuvable."
                    : "Une erreur est survenue lors du chargement des données.";

                messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: errorMessage
                });

                // Get base route by splitting endpoint (e.g., '/api/sites' -> '/sites')
                // This is a simple fallback, might need adjustment based on route structure
                // const fallbackRoute = endpointPath.replace('/api/', '/');
                // router.navigate([fallbackRoute]).catch(() => router.navigate(['/']));
                // location.back()

                return of(null);
            })
        );
    };
}
