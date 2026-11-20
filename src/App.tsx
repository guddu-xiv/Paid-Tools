import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Database,
  Globe,
  GraduationCap,
  Radio,
} from 'lucide-react';
import { MockMatrixHubStudio } from './components/MockMatrixHubStudio';
import { RbeRevolutionStudio } from './components/RbeRevolutionStudio';
import { VidyagramStudio } from './components/VidyagramStudio';
import { TestrankingStudio } from './components/TestrankingStudio';
import { RwaStudio } from './components/RwaStudio';
import { TestwillStudio } from './components/TestwillStudio';
import { TestbookStudio } from './components/TestbookStudio';
import { DkAgarwalStudio } from './components/DkAgarwalStudio';
import { ThePunditsStudio } from './components/ThePunditsStudio';
import { OliveBoardStudio } from './components/OliveBoardStudio';
import { BorderlandSscStudio } from './components/BorderlandSscStudio';
import { TgManageStudio } from './components/TgManageStudio';

type StudioMode =
  | 'mockmatrix'
  | 'testbook'
  | 'dkagarwal'
  | 'thepundits'
  | 'rberevolution'
  | 'vidyagram'
  | 'testranking'
  | 'rwa'
  | 'testwill'
  | 'oliveboard'
  | 'borderlandssc'
  | 'tgmanage';

export default function App() {
  const [studioMode, setStudioMode] = useState<StudioMode>('mockmatrix');

  const handleSwitchStudioMode = (nextMode: StudioMode) => {
    setStudioMode(nextMode);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/80 text-slate-900 font-anek select-none sm:select-auto">
      {/* Top Main Header: Centered PDF Studio + Dashed Line + Studio Tabs */}
      <div className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-md shadow-xs">
        {/* 1. Centered Header */}
        <div className="flex items-center justify-center px-4 py-2 sm:py-2.5">
          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 text-center">
            Paid Content
          </h1>
        </div>

        {/* 2. Dashed Line */}
        <div className="border-b-2 border-dashed border-slate-300" />

        {/* 3. Studio Tab Bar */}
        <div className="px-3 sm:px-6 pt-1.5 bg-slate-50/90 border-b border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => handleSwitchStudioMode('mockmatrix')}
            className={`px-4 py-2 text-xs font-bold tracking-wide rounded-t-xl -mb-px flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-all cursor-pointer ${
              studioMode === 'mockmatrix'
                ? 'text-violet-900 bg-white border border-b-0 border-slate-200 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 bg-transparent border border-transparent'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                studioMode === 'mockmatrix' ? 'bg-violet-600' : 'bg-slate-300'
              }`}
            />
            <Database className="w-3.5 h-3.5 text-violet-600" />
            <span>Mock Matrix Hub</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchStudioMode('testbook')}
            className={`px-4 py-2 text-xs font-bold tracking-wide rounded-t-xl -mb-px flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-all cursor-pointer ${
              studioMode === 'testbook'
                ? 'text-cyan-900 bg-white border border-b-0 border-slate-200 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 bg-transparent border border-transparent'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                studioMode === 'testbook' ? 'bg-cyan-600' : 'bg-slate-300'
              }`}
            />
            <BookOpen className="w-3.5 h-3.5 text-cyan-600" />
            <span>Testbook</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchStudioMode('dkagarwal')}
            className={`px-4 py-2 text-xs font-bold tracking-wide rounded-t-xl -mb-px flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-all cursor-pointer ${
              studioMode === 'dkagarwal'
                ? 'text-indigo-950 bg-white border border-b-0 border-slate-200 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 bg-transparent border border-transparent'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                studioMode === 'dkagarwal' ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            />
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            <span>DK Agarwal</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchStudioMode('borderlandssc')}
            className={`px-4 py-2 text-xs font-bold tracking-wide rounded-t-xl -mb-px flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-all cursor-pointer ${
              studioMode === 'borderlandssc'
                ? 'text-indigo-950 bg-white border border-b-0 border-slate-200 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 bg-transparent border border-transparent'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                studioMode === 'borderlandssc' ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            />
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            <span>SSC Borderland</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchStudioMode('rberevolution')}
            className={`px-4 py-2 text-xs font-bold tracking-wide rounded-t-xl -mb-px flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-all cursor-pointer ${
              studioMode === 'rberevolution'
                ? 'text-amber-950 bg-white border border-b-0 border-slate-200 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 bg-transparent border border-transparent'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                studioMode === 'rberevolution' ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            />
            <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
            <span>RBE</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchStudioMode('vidyagram')}
            className={`px-4 py-2 text-xs font-bold tracking-wide rounded-t-xl -mb-px flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-all cursor-pointer ${
              studioMode === 'vidyagram'
                ? 'text-teal-950 bg-white border border-b-0 border-slate-200 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 bg-transparent border border-transparent'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                studioMode === 'vidyagram' ? 'bg-teal-600' : 'bg-slate-300'
              }`}
            />
            <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
            <span>Vidyagram</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchStudioMode('thepundits')}
            className={`px-4 py-2 text-xs font-bold tracking-wide rounded-t-xl -mb-px flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-all cursor-pointer ${
              studioMode === 'thepundits'
                ? 'text-amber-950 bg-white border border-b-0 border-slate-200 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 bg-transparent border border-transparent'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                studioMode === 'thepundits' ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            />
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>The Pundit</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchStudioMode('testranking')}
            className={`px-4 py-2 text-xs font-bold tracking-wide rounded-t-xl -mb-px flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-all cursor-pointer ${
              studioMode === 'testranking'
                ? 'text-purple-950 bg-white border border-b-0 border-slate-200 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 bg-transparent border border-transparent'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                studioMode === 'testranking' ? 'bg-purple-600' : 'bg-slate-300'
              }`}
            />
            <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
            <span>Test Ranking</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchStudioMode('rwa')}
            className={`px-4 py-2 text-xs font-bold tracking-wide rounded-t-xl -mb-px flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-all cursor-pointer ${
              studioMode === 'rwa'
                ? 'text-orange-950 bg-white border border-b-0 border-slate-200 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 bg-transparent border border-transparent'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                studioMode === 'rwa' ? 'bg-orange-600' : 'bg-slate-300'
              }`}
            />
            <GraduationCap className="w-3.5 h-3.5 text-orange-600" />
            <span>RWA</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchStudioMode('testwill')}
            className={`px-4 py-2 text-xs font-bold tracking-wide rounded-t-xl -mb-px flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-all cursor-pointer ${
              studioMode === 'testwill'
                ? 'text-blue-950 bg-white border border-b-0 border-slate-200 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 bg-transparent border border-transparent'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                studioMode === 'testwill' ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            />
            <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
            <span>Test Will</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchStudioMode('oliveboard')}
            className={`px-4 py-2 text-xs font-bold tracking-wide rounded-t-xl -mb-px flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-all cursor-pointer ${
              studioMode === 'oliveboard'
                ? 'text-emerald-950 bg-white border border-b-0 border-slate-200 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 bg-transparent border border-transparent'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                studioMode === 'oliveboard' ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            />
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>OliveBoard</span>
            <span className="text-[9px] px-1 py-0.2 bg-amber-400 text-slate-950 font-black rounded ml-0.5">
              PAID: TRUE
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchStudioMode('tgmanage')}
            className={`px-4 py-2 text-xs font-bold tracking-wide rounded-t-xl -mb-px flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-all cursor-pointer ${
              studioMode === 'tgmanage'
                ? 'text-sky-950 bg-white border border-b-0 border-slate-200 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 bg-transparent border border-transparent'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                studioMode === 'tgmanage' ? 'bg-sky-500' : 'bg-slate-300'
              }`}
            />
            <Radio className="w-3.5 h-3.5 text-sky-600" />
            <span>TG Manage</span>
            <span className="text-[9px] px-1 py-0.2 bg-sky-500 text-white font-black rounded ml-0.5">
              CHANNEL MGR
            </span>
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="no-print flex-1 flex flex-col max-w-[1440px] w-full mx-auto">
        <main className="flex-1 p-2.5 sm:p-4 md:p-6 overflow-y-auto">
          {studioMode === 'mockmatrix' && (
            <div className="max-w-[1560px] mx-auto">
              <MockMatrixHubStudio />
            </div>
          )}

          {studioMode === 'rberevolution' && (
            <div className="max-w-[1560px] mx-auto">
              <RbeRevolutionStudio />
            </div>
          )}

          {studioMode === 'vidyagram' && (
            <div className="max-w-[1560px] mx-auto">
              <VidyagramStudio />
            </div>
          )}

          {studioMode === 'testranking' && (
            <div className="max-w-[1560px] mx-auto">
              <TestrankingStudio />
            </div>
          )}

          {studioMode === 'rwa' && (
            <div className="max-w-[1560px] mx-auto">
              <RwaStudio />
            </div>
          )}

          {studioMode === 'testwill' && (
            <div className="max-w-[1560px] mx-auto">
              <TestwillStudio />
            </div>
          )}

          {studioMode === 'testbook' && (
            <div className="max-w-[1560px] mx-auto">
              <TestbookStudio />
            </div>
          )}

          {studioMode === 'dkagarwal' && (
            <div className="max-w-[1560px] mx-auto">
              <DkAgarwalStudio />
            </div>
          )}

          {studioMode === 'thepundits' && (
            <div className="max-w-[1560px] mx-auto">
              <ThePunditsStudio />
            </div>
          )}

          {studioMode === 'oliveboard' && (
            <div className="max-w-[1560px] mx-auto">
              <OliveBoardStudio />
            </div>
          )}

          {studioMode === 'borderlandssc' && (
            <div className="max-w-[1560px] mx-auto">
              <BorderlandSscStudio />
            </div>
          )}

          {studioMode === 'tgmanage' && (
            <div className="max-w-[1560px] mx-auto">
              <TgManageStudio />
            </div>
          )}

          {/* App Footer */}
          <footer className="mt-8 pt-4 pb-6 border-t border-slate-200/80 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
            <span>Developer :</span>
            <a
              href="https://instagram.com/guddu.xiv"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-900 font-bold hover:border-pink-400 hover:text-pink-600 shadow-2xs transition-colors"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#E1306C"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
              <span>guddu.xiv</span>
            </a>
          </footer>
        </main>
      </div>
    </div>
  );
}
