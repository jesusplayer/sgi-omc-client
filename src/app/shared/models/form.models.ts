export type FormFieldType = 'text' | 'number' | 'textarea' | 'select' | 'checkbox' | 'color' | 'date';

export interface FormFieldOption {
    value: string | number | boolean;
    label: string;
}

export interface FormField {
    key: string;                  // Nom de la propriété du modèle (ex: 'patient_id')
    label: string;                // Libellé affiché (ex: 'Patient')
    type: FormFieldType;          // Type de contrôle
    required?: boolean;           // Champ obligatoire
    placeholder?: string;         // Placeholder de l'input
    min?: number;                 // Contrainte de validation (ex: min)
    max?: number;                 // Contrainte de validation (ex: max)
    step?: string | number;       // Step pour les nombres ou dates
    options?: FormFieldOption[];  // Options pour les select
    disabled?: boolean;           // État désactivé
    rows?: number;                // Lignes pour textarea
}

export interface FormSection {
    title?: string;               // Titre optionnel de la section
    gridColumns?: number;         // Disposition sur X colonnes (1, 2, 3...)
    fields: FormField[];          // Liste des champs
}
