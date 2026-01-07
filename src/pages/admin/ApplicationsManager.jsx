/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/prefer-nullish-coalescing */
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { BiSearch, BiFilter, BiCheckCircle, BiXCircle, BiDownload, BiChevronDown, BiChevronUp } from 'react-icons/bi';
import { useTranslation } from 'react-i18next';
import './AdminLayout.css';
import './ApplicationsManager.css';

const ApplicationsManager = () => {
    const { t, i18n } = useTranslation();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleError, setVisibleError] = useState(null);
    const [expandedRow, setExpandedRow] = useState(null);

    const fetchApplications = React.useCallback(async () => {
        // setLoading(true); // Relies on initial state being true to avoid double render warning in useEffect, or manage differently
        const { data, error: fetchError } = await supabase
            .from('career_applications')
            .select('*')
            .order('created_at', { ascending: false });

        if (fetchError) {
            console.error('Error fetching applications:', fetchError);
            setVisibleError(fetchError.message);
        } else {
            setApplications(data || []);
            setVisibleError(null);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        // eslint-disable-next-line
        void fetchApplications();
    }, [fetchApplications]);

    const updateStatus = async (id, newStatus) => {
        console.log('Update Status Triggered:', id, newStatus);
        const confirmMsg = `${t('admin.applications.actions.confirm_update', 'Are you sure you want to mark this application as')} ${newStatus}?`;
        if (!window.confirm(confirmMsg)) {
            console.log('Update cancelled by user');
            return;
        }

        console.log('Sending update to Supabase...');
        const { data, error: updateError } = await supabase
            .from('career_applications')
            .update({ status: newStatus })
            .eq('id', id)
            .select();

        if (updateError) {
            console.error('Update Error:', updateError);
            alert(`${t('admin.applications.actions.update_error', 'Error updating status')}: ${updateError.message}`);
        } else {
            console.log('Update Success:', data);
            void fetchApplications();
        }
    };

    const filteredApps = applications.filter(app => {
        const matchesStatus = filterStatus === 'all' || app.status === filterStatus;

        if (searchQuery === '') return matchesStatus;

        const query = searchQuery.toLowerCase();
        const matchesName = app.full_name?.toLowerCase().includes(query) ?? false;
        const matchesEmail = app.email?.toLowerCase().includes(query) ?? false;

        return matchesStatus && (matchesName || matchesEmail);
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'new_candidate': return 'var(--accent-blue)';
            case 'test_passed': return 'var(--accent-neon)';
            case 'task_submitted': return 'var(--accent-violet)';
            case 'approved': return '#10b981';
            case 'rejected': return '#ef4444';
            default: return 'var(--text-secondary)';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'new_candidate': return t('admin.applications.filters.new', 'New Candidate');
            case 'test_passed': return t('admin.applications.filters.passed', 'Test Passed');
            case 'task_submitted': return t('admin.applications.filters.submitted', 'Task Submitted');
            case 'approved': return t('admin.applications.filters.approved', 'Approved');
            case 'rejected': return t('admin.applications.filters.rejected', 'Rejected');
            default: return String(status).replace('_', ' ').toUpperCase();
        }
    };

    return (
        <div className="crm-container applications-page">
            <div className="applications-header">
                <h1>{t('admin.applications.title', 'Applications')}</h1>
                <p>{t('admin.applications.subtitle', 'Manage and review candidate submissions')}</p>
            </div>

            <div className="applications-controls">
                <div className="search-box">
                    <BiSearch className="icon" />
                    <input
                        placeholder={t('admin.applications.search_placeholder', 'Search candidates by name, email...')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="filter-box">
                    <BiFilter className="icon" />
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="all">{t('admin.applications.filters.all', 'All Statuses')}</option>
                        <option value="new_candidate">{t('admin.applications.filters.new', 'New Candidate')}</option>
                        <option value="test_passed">{t('admin.applications.filters.passed', 'Test Passed')}</option>
                        <option value="task_submitted">{t('admin.applications.filters.submitted', 'Task Submitted')}</option>
                        <option value="approved">{t('admin.applications.filters.approved', 'Approved')}</option>
                        <option value="rejected">{t('admin.applications.filters.rejected', 'Rejected')}</option>
                    </select>
                </div>
            </div>

            {visibleError && (
                <div style={{ padding: '15px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', marginBottom: '20px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <BiXCircle style={{ display: 'inline', marginRight: '5px' }} /> {visibleError}
                </div>
            )}

            {loading ? (
                <div className="admin-loading">{t('admin.applications.loading', 'Loading applications...')}</div>
            ) : (
                <div className="table-container">
                    <table className="glass-table">
                        <thead>
                            <tr>
                                <th>{t('admin.applications.table.name', 'Candidate Name')}</th>
                                <th>{t('admin.applications.table.position', 'Position')}</th>
                                <th>{t('admin.applications.table.experience', 'Experience')}</th>
                                <th>{t('admin.applications.table.score', 'Test Score')}</th>
                                <th>{t('admin.applications.table.status', 'Status')}</th>
                                <th>{t('admin.applications.table.date', 'Applied Date')}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredApps.map((app) => (
                                <React.Fragment key={app.id}>
                                    <tr
                                        className={`user-row ${expandedRow === app.id ? 'active-row' : ''}`}
                                        onClick={() => setExpandedRow(expandedRow === app.id ? null : app.id)}
                                    >
                                        <td>{app.full_name}</td>
                                        <td>{app.position}</td>
                                        <td>{app.experience}</td>
                                        <td>
                                            <span className={`score-badge ${app.test_score >= 5 ? 'score-high' : 'score-low'}`}>
                                                {app.test_score}/5
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                className="status-badge"
                                                style={{
                                                    background: `${getStatusColor(app.status)}15`,
                                                    color: getStatusColor(app.status),
                                                    border: `1px solid ${getStatusColor(app.status)}30`
                                                }}
                                            >
                                                {getStatusLabel(app.status)}
                                            </span>
                                        </td>
                                        <td>{new Date(app.created_at).toLocaleDateString(i18n.language)}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            {expandedRow === app.id ? <BiChevronUp /> : <BiChevronDown />}
                                        </td>
                                    </tr>
                                    {expandedRow === app.id && (
                                        <tr className="details-row">
                                            <td colSpan="7">
                                                <div className="details-card">
                                                    <div className="detail-section">
                                                        <h4>{t('admin.applications.details.profile', 'Candidate Profile')}</h4>
                                                        <div className="detail-item"><strong>{t('admin.applications.details.email', 'Email:')}</strong> {app.email}</div>
                                                        <div className="detail-item"><strong>{t('admin.applications.details.contact', 'Contact:')}</strong> {app.contact}</div>
                                                        <div className="detail-item">
                                                            <strong>{t('admin.applications.details.why_us', 'Why Us:')}</strong>
                                                            <p style={{ marginTop: '0.5rem', opacity: 0.8 }}>{app.why_us}</p>
                                                        </div>
                                                        <div className="detail-item">
                                                            <strong>{t('admin.applications.details.stack', 'Tech Stack:')}</strong>
                                                            <div className="tools-list">
                                                                {app.tools && app.tools.length > 0 ? (
                                                                    app.tools.map(t => <span key={t} className="tool-tag">{t}</span>)
                                                                ) : (
                                                                    <span style={{ opacity: 0.5 }}>{t('admin.applications.details.no_tools', 'No tools listed')}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="detail-section">
                                                        <h4>{t('admin.applications.details.assessment', 'Assessment & Actions')}</h4>

                                                        <div className="detail-item">
                                                            <strong>{t('admin.applications.table.status', 'Status')}:</strong> {getStatusLabel(app.status)}
                                                        </div>

                                                        {app.task_file_url ? (
                                                            <a href={app.task_file_url} target="_blank" rel="noopener noreferrer" className="btn-download">
                                                                <BiDownload /> {t('admin.applications.details.download_task', 'Download Practical Task')}
                                                            </a>
                                                        ) : (
                                                            <div style={{ padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', display: 'inline-block', fontStyle: 'italic', opacity: 0.6 }}>
                                                                {t('admin.applications.details.no_task', 'No practical task uploaded yet.')}
                                                            </div>
                                                        )}

                                                        <div className="action-buttons">
                                                            <button
                                                                className="btn-approve"
                                                                onClick={(e) => { e.stopPropagation(); void updateStatus(app.id, 'approved'); }}
                                                            >
                                                                <BiCheckCircle size={20} /> {t('admin.applications.actions.approve', 'Approve Application')}
                                                            </button>
                                                            <button
                                                                className="btn-reject"
                                                                onClick={(e) => { e.stopPropagation(); void updateStatus(app.id, 'rejected'); }}
                                                            >
                                                                <BiXCircle size={20} /> {t('admin.applications.actions.reject', 'Reject')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                    {!loading && filteredApps.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                            {t('admin.applications.empty', 'No applications found matching your criteria.')}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ApplicationsManager;
