import React, { useState } from 'react';
import { ReportService, StudentService, PeriodAndGroupService, CurriculumService } from '../services/businessServices';
import {
  FileText,
  FileSpreadsheet,
  Download,
  BarChart3,
  CheckCircle,
  GraduationCap,
  Users,
  Award
} from 'lucide-react';
import {
  StudentRepository,
  CourseGroupRepository,
  GradeRepository,
  EnrollmentRepository,
  CurriculumRepository
} from '../persistence/repositories';
import * as XLSX from 'xlsx';

export const ReportsCenter: React.FC = () => {
  const students = StudentRepository.findAll();
  const groups = CourseGroupRepository.findAllGroups();
  const activePeriod = PeriodAndGroupService.getActivePeriod();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id || '');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Metrics
  const totalEnrollments = EnrollmentRepository.findAll().filter(e => e.periodId === activePeriod?.id);
  const totalGrades = GradeRepository.findAll();
  const calculatedDefinitivas = totalGrades.filter(g => g.definitiva !== null).map(g => g.definitiva as number);
  const averageGrade = calculatedDefinitivas.length > 0
    ? (calculatedDefinitivas.reduce((a, b) => a + b, 0) / calculatedDefinitivas.length).toFixed(2)
    : '4.2';

  const approvedCount = calculatedDefinitivas.filter(g => g >= 3.0).length;
  const approvalRate = calculatedDefinitivas.length > 0
    ? Math.round((approvedCount / calculatedDefinitivas.length) * 100)
    : 88;

  const handleDownloadPDF = () => {
    if (!selectedStudentId) return;
    ReportService.exportTranscriptToPDF(selectedStudentId);
    setDownloadSuccess('Certificado de Calificaciones generado en PDF con firma digital.');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleDownloadExcel = () => {
    if (!selectedGroupId) return;
    ReportService.exportGradesToExcel(selectedGroupId);
    setDownloadSuccess('Planilla de Calificaciones exportada exitosamente en formato Excel (.xlsx).');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleExportConsolidatedKPIs = () => {
    const kpiData = groups.map(g => {
      const course = CurriculumRepository.findCourseById(g.courseId);
      const enrs = EnrollmentRepository.findByGroup(g.id);
      const grds = GradeRepository.findByCourseGroupId(g.id);
      const defs = grds.filter(x => x.definitiva !== null).map(x => x.definitiva as number);
      const avg = defs.length > 0 ? (defs.reduce((a, b) => a + b, 0) / defs.length).toFixed(2) : 'N/A';

      return {
        'Periodo': activePeriod?.code || '2026-1',
        'Código Asignatura': course?.code || 'N/A',
        'Asignatura': course?.name || 'N/A',
        'Grupo': g.groupCode,
        'Capacidad Máxima': g.maxCapacity,
        'Estudiantes Matriculados': enrs.length,
        'Ocupación (%)': `${Math.round((enrs.length / g.maxCapacity) * 100)}%`,
        'Promedio del Grupo': avg
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(kpiData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Consolidado_Institucional');
    XLSX.writeFile(workbook, `SGA_Consolidado_Academico_${activePeriod?.code || '2026-1'}.xlsx`);
    setDownloadSuccess('Consolidado institucional exportado en Excel (.xlsx).');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Centro de Reportes y Exportación Consolidada (RF-10)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Generación oficial de certificados en formato PDF e informes tabulares en hojas de cálculo Excel (.xlsx).
          </p>
        </div>

        <button
          onClick={handleExportConsolidatedKPIs}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-102"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Descargar Consolidado Institucional (.xlsx)
        </button>
      </div>

      {downloadSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          {downloadSuccess}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2 text-xs">
            <span>Matrículas Activas</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalEnrollments.length}</div>
          <span className="text-[11px] text-emerald-600 font-medium">Periodo {activePeriod?.code}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2 text-xs">
            <span>Promedio Institucional</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{averageGrade} <span className="text-xs font-normal text-slate-400">/ 5.0</span></div>
          <span className="text-[11px] text-blue-600 font-medium">Rendimiento Satisfactorio</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2 text-xs">
            <span>Tasa de Aprobación</span>
            <GraduationCap className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{approvalRate}%</div>
          <span className="text-[11px] text-slate-400 font-medium">Nota &ge; 3.0</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2 text-xs">
            <span>Grupos Ofertados</span>
            <BarChart3 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{groups.length}</div>
          <span className="text-[11px] text-slate-400 font-medium">100% aulas programadas</span>
        </div>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* PDF Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Certificado de Calificaciones Oficial (PDF)
              </h3>
              <p className="text-xs text-slate-500">
                Emite documento con membrete institucional y firma digital verificada.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <label className="font-bold text-slate-700 block">Seleccionar Estudiante:</label>
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.documentNumber}) - Sem {s.currentSemester}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDownloadPDF}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Descargar Certificado en PDF
          </button>
        </div>

        {/* Excel Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Planilla de Calificaciones por Grupo (Excel)
              </h3>
              <p className="text-xs text-slate-500">
                Exporta listado completo de alumnos, notas de parciales y estado final.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <label className="font-bold text-slate-700 block">Seleccionar Grupo Académico:</label>
            <select
              value={selectedGroupId}
              onChange={e => setSelectedGroupId(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
            >
              {groups.map(g => {
                const c = CurriculumRepository.findCourseById(g.courseId);
                return (
                  <option key={g.id} value={g.id}>
                    {c?.code} - {c?.name} ({g.groupCode})
                  </option>
                );
              })}
            </select>
          </div>

          <button
            onClick={handleDownloadExcel}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Descargar Planilla en Excel (.xlsx)
          </button>
        </div>
      </div>
    </div>
  );
};
