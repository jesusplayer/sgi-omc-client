export interface GridColumn {
    field: string;
    header: string;
    type?: 'text' | 'badge' | 'link' | 'date';
    /** Fonction pour récupérer ou calculer la valeur à afficher (si différente de item[field]) */
    valueGetter?: (item: any) => string;
    /** Fonction pour déterminer la couleur du badge (si type === 'badge') */
    badgeColor?: (item: any) => string;
    /** Fonction pour générer le tableau du routerLink (si type === 'link') */
    routerLink?: (item: any) => any[];
    /** Classe CSS optionnelle pour la cellule */
    cellClass?: string | ((item: any) => string);
    /** Style CSS optionnel pour la cellule (ex: 'max-width: 200px') */
    cellStyle?: string | ((item: any) => string);
}

export interface GridHeaderAction {
    label: string;
    icon?: string;
    action?: () => void;
    route?: any[];
    class?: string;
    title?: string;
}

export interface GridRowAction {
    label?: string;
    icon?: string;
    actionFn?: (item: any) => void;
    routeFn?: (item: any) => any[];
    class?: string;
    title?: string;
    hideFn?: (item: any) => boolean;
}
