
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Services from './pages/Services';
import Technologies from './pages/Technologies';
import About from './pages/About';
import Contact from './pages/Contact';
import Calculator from './pages/Calculator';
import { initGA, logPageView } from './utils/analytics';
import ScrollToTop from './components/common/ScrollToTop';
import AdminLayout from './pages/admin/AdminLayout';
import LoginPage from './pages/admin/LoginPage';
import Dashboard from './pages/admin/Dashboard';
import FAQManager from './pages/admin/FAQManager';
import TranslationManager from './pages/admin/TranslationManager';
import MigrationTool from './pages/admin/MigrationTool';
import ServicesManager from './pages/admin/ServicesManager';
import BenefitsManager from './pages/admin/BenefitsManager';
import TechnologiesManager from './pages/admin/TechnologiesManager';
import SocialsManager from './pages/admin/SocialsManager';
import ClientsManager from './pages/admin/ClientsManager';
import TemplatesManager from './pages/admin/TemplatesManager';
import ProjectsManager from './pages/admin/ProjectsManager';
import ProjectDetails from './pages/admin/ProjectDetails';
import TasksManager from './pages/admin/TasksManager';
import TodayPage from './pages/admin/TodayPage';
import DailyReview from './pages/admin/DailyReview';
import WeeklyReview from './pages/admin/WeeklyReview';
import MessagesManager from './pages/admin/MessagesManager';
import ApplicationsManager from './pages/admin/ApplicationsManager';
import Careers from './pages/Careers';

import { fetchSupabaseTranslations } from './lib/supabaseI18n';
import i18n from './i18n';

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    initGA('G-XXXXXXXXXX'); // Replace with actual ID

    // Load dynamic translations
    const loadTranslations = async () => {
      const resources = await fetchSupabaseTranslations();
      Object.keys(resources).forEach(lng => {
        i18n.addResourceBundle(lng, 'translation', resources[lng].translation, true, true);
      });
    };
    loadTranslations().catch(console.error);

  }, []);

  useEffect(() => {
    logPageView();
  }, [location]);

  return null;
};


import FlyingBot from './components/FlyingBot';
import ChatWidget from './components/ChatWidget';

const BotIntegration = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  return (
    <>
      {!isChatOpen && <FlyingBot onClick={() => setIsChatOpen(true)} />}
      <ChatWidget isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
};

function App() {


  return (
    <BrowserRouter>
      <ScrollToTop />
      <AnalyticsTracker />
      <BotIntegration />

      <React.Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="services" element={<Services />} />
            <Route path="technologies" element={<Technologies />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="calculator" element={<Calculator />} />
            <Route path="careers" element={<Careers />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<TodayPage />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="faq" element={<FAQManager />} />
            <Route path="translations" element={<TranslationManager />} />
            <Route path="translations" element={<TranslationManager />} />
            <Route path="migrate" element={<MigrationTool />} />
            <Route path="services" element={<ServicesManager />} />
            <Route path="benefits" element={<BenefitsManager />} />
            <Route path="technologies" element={<TechnologiesManager />} />
            <Route path="socials" element={<SocialsManager />} />
            <Route path="clients" element={<ClientsManager />} />
            <Route path="templates" element={<TemplatesManager />} />
            <Route path="projects" element={<ProjectsManager />} />
            <Route path="projects/:id" element={<ProjectDetails />} />
            <Route path="tasks" element={<TasksManager />} />
            <Route path="today" element={<TodayPage />} />
            <Route path="daily-review" element={<DailyReview />} />
            <Route path="weekly-review" element={<WeeklyReview />} />
            <Route path="messages" element={<MessagesManager />} />
            <Route path="applications" element={<ApplicationsManager />} />
          </Route>
          <Route path="/admin/login" element={<LoginPage />} />
        </Routes>
      </React.Suspense>
    </BrowserRouter >
  );
}

export default App;
