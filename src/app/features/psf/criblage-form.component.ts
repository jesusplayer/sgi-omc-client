import { Component, inject, signal, OnInit, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { GenericFormComponent } from '../../shared/components/generic-form/generic-form.component';
import { FormSection } from '../../shared/models/form.models';

@Component({
  selector: 'app-criblage-form',
  standalone: true,
  imports: [GenericFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!!item()) {
      <div class="card" style="margin-bottom:1rem">
        <div class="flex items-center gap-4">
          <div class="stat-icon" style="background:rgba(99,102,241,0.1);color:#6366f1;font-size:1.5rem">👤</div>
          <div>
            <div class="font-semibold">{{ item()!.nom }} {{ item()!.prenom }}</div>
            <div class="text-sm text-muted">{{ item()!.accreditation_id }} · {{ item()!.nationalite }} · {{ item()!.type_personne }}</div>
          </div>
        </div>
      </div>
    }

    <app-generic-form
      title="🩺 Criblage médical"
      subtitle="UC-02 — Criblage au Point de Sécurité Frontière"
      [schema]="currentSchema()"
      [(formData)]="form"
      (save)="onSubmit()"
      (cancel)="onCancel()"
      saveLabel="✅ Valider le criblage"
      alignActions="between"
      [saving]="saving()"
    ></app-generic-form>
  `
})
export class CriblageFormComponent implements OnInit {
  item = input<any | null>(null);
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);
  saving = signal(false);

  form: any = {
    numero_vol: '', compagnie_aerienne: '', aeroport_origine: '', numero_siege: '',
    date_arrivee: new Date().toISOString().slice(0, 16),
    temperature_criblage: 36.5, symptomes_declares: false, detail_symptomes: '',
    decision_frontiere: 'AUTORISATION', motif_decision: '',
  };

  baseSchema: FormSection[] = [
    {
      gridColumns: 2,
      fields: [
        { key: 'numero_vol', label: 'N° de vol', type: 'text', required: true, placeholder: 'AF0572' },
        { key: 'compagnie_aerienne', label: 'Compagnie aérienne', type: 'text', required: true, placeholder: 'Air France' },
        { key: 'aeroport_origine', label: "Aéroport d'origine", type: 'text', required: true, placeholder: 'CDG' },
        { key: 'numero_siege', label: 'N° de siège', type: 'text', placeholder: '12A' },
        { key: 'date_arrivee', label: "Date d'arrivée", type: 'text', required: true } // datetime-local behavior with string works usually
      ]
    },
    {
      fields: [
        { key: 'temperature_criblage', label: 'Température (°C)', type: 'number', step: '0.1', required: true, placeholder: '36.5' },
        { key: 'symptomes_declares', label: 'Symptômes déclarés', type: 'checkbox' }
      ]
    },
    {
      fields: [
        {
          key: 'decision_frontiere', label: 'Décision frontière', type: 'select', required: true,
          options: [
            { value: 'AUTORISATION', label: '✅ Autorisation' },
            { value: 'REFERENCE_TEST', label: '🧪 Référence test' },
            { value: 'ISOLEMENT', label: '⚠️ Isolement' },
            { value: 'REFOULEMENT', label: '🚫 Refoulement' }
          ]
        }
      ]
    }
  ];

  // Workaround since ngModel doesn't fire events that signals can easily intercept from generic component wrapper
  localSymptomesDeclares = signal(false);
  localDecisionFrontiere = signal('AUTORISATION');

  currentSchema = computed(() => {
    const schema = structuredClone(this.baseSchema);

    // Patch date_arrivee input type since 'datetime-local' isn't explicitly defined in FormFieldType yet, but 'text' can fallback or we can add it later.
    // However, text works for now. If needed, we expand the generic form to support 'datetime-local'.

    if (this.localSymptomesDeclares()) {
      schema[1].fields.push({
        key: 'detail_symptomes', label: 'Détail des symptômes', type: 'textarea', placeholder: 'Céphalées, fatigue, toux…'
      });
    }

    if (this.localDecisionFrontiere() !== 'AUTORISATION') {
      schema[2].fields.push({
        key: 'motif_decision', label: 'Motif de la décision', type: 'textarea'
      });
    }

    return schema;
  });

  ngOnInit() {
    setInterval(() => {
      if (this.form.symptomes_declares !== this.localSymptomesDeclares()) {
        this.localSymptomesDeclares.set(!!this.form.symptomes_declares);
      }
      if (this.form.decision_frontiere !== this.localDecisionFrontiere()) {
        this.localDecisionFrontiere.set(this.form.decision_frontiere);
      }
    }, 100);
  }

  onSubmit() {
    if (!this.form.numero_vol || !this.form.compagnie_aerienne || !this.form.aeroport_origine || !this.form.date_arrivee || this.form.temperature_criblage === null || !this.form.decision_frontiere) return;

    this.saving.set(true);
    const body = {
      ...this.form,
      patient_id: this.item()?.patient_id || '',
      psf_agent_id: this.auth.user()?.user_id,
      site_psf_id: this.auth.site()?.site_id,
    };
    this.http.post('/api/tracing-vol', body).subscribe({
      next: () => this.router.navigate(['/psf']),
      error: () => this.saving.set(false)
    });
  }

  onCancel() {
    this.router.navigate(['/psf']);
  }
}
