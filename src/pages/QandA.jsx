import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'

function timeAgo(ts) {
  if (!ts) return ''
  const diff = (Date.now() - new Date(ts)) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(ts).toLocaleDateString()
}

// Defined outside QandA so React doesn't remount it on every render
function QuestionBlock({
  q, profile, isCoach,
  expanded, setExpanded,
  answerForms, postingAnswer,
  onVote, onPostAnswer, onToggleResolved, onSetAnswerField,
}) {
  const voteCount   = q.question_votes?.length || 0
  const hasVoted    = q.question_votes?.some(v => v.profile_id === profile.id)
  const isExp       = expanded === q.id
  const answers     = [...(q.question_answers || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  const answerCount = answers.length
  const af          = answerForms[q.id] || { body: '', link: '' }

  return (
    <div className={`rounded-2xl border-2 transition-all ${
      q.is_resolved
        ? 'border-green-200 bg-green-50/40'
        : isExp
        ? 'border-atlantic-navy/30 bg-white shadow-md'
        : 'border-powder bg-white hover:border-denim/40 hover:shadow-sm'
    }`}>

      {/* Question row */}
      <div className="p-5 flex items-start gap-4">
        {/* Upvote */}
        <button
          onClick={() => onVote(q)}
          className={`flex flex-col items-center gap-0.5 shrink-0 pt-0.5 rounded-lg p-1 transition-colors ${
            hasVoted ? 'text-honeycomb' : 'text-denim/40 hover:text-denim hover:bg-powder'
          }`}
          title={hasVoted ? 'Remove vote' : 'Same question — upvote'}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-bold leading-none">{voteCount}</span>
        </button>

        {/* Body + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2 mb-1.5">
            {voteCount >= 2 && !q.is_resolved && (
              <span className="text-xs font-bold bg-honeycomb/20 text-honeycomb px-2.5 py-0.5 rounded-full">
                🔥 {voteCount} people asked this
              </span>
            )}
            {q.is_resolved && (
              <span className="text-xs font-bold bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full">
                ✓ Resolved
              </span>
            )}
          </div>
          <p className={`text-base font-medium leading-snug ${q.is_resolved ? 'text-denim' : 'text-classic-navy'}`}>
            {q.body}
          </p>
          <p className="text-xs text-denim mt-1.5">
            {q.profiles?.full_name || 'Anonymous'} · {timeAgo(q.created_at)}
            {answerCount > 0 && (
              <span className="ml-2 font-semibold text-atlantic-navy">
                · {answerCount} {answerCount === 1 ? 'answer' : 'answers'}
              </span>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {isCoach && (
            <button
              onClick={() => onToggleResolved(q)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                q.is_resolved
                  ? 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                  : 'border-powder text-denim hover:border-green-400 hover:text-green-700'
              }`}
            >
              {q.is_resolved ? '✓ Resolved' : 'Mark resolved'}
            </button>
          )}
          <button
            onClick={() => setExpanded(isExp ? null : q.id)}
            className="text-sm font-semibold text-atlantic-navy hover:underline whitespace-nowrap"
          >
            {isExp ? 'Close' : answerCount > 0 ? `View ${answerCount} ${answerCount === 1 ? 'answer' : 'answers'}` : 'Answer'}
          </button>
        </div>
      </div>

      {/* Expanded panel */}
      {isExp && (
        <div className="border-t border-powder/60 px-5 pb-5 pt-4 space-y-5">

          {/* Existing answers */}
          {answers.length > 0 && (
            <div className="space-y-3">
              {answers.map(a => {
                const coachAnswer = a.profiles?.role === 'coach'
                return (
                  <div key={a.id} className={`rounded-xl p-4 ${coachAnswer ? 'bg-atlantic-navy' : 'bg-powder/50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold ${coachAnswer ? 'text-soft-butter' : 'text-classic-navy'}`}>
                        {coachAnswer ? '👩‍💼 Coach' : (a.profiles?.full_name || 'Student')}
                      </span>
                      <span className={`text-xs ${coachAnswer ? 'text-powder/60' : 'text-denim/60'}`}>
                        {timeAgo(a.created_at)}
                      </span>
                    </div>
                    {a.body && (
                      <p className={`text-sm leading-relaxed whitespace-pre-line ${coachAnswer ? 'text-soft-butter' : 'text-classic-navy'}`}>
                        {a.body}
                      </p>
                    )}
                    {a.link && (
                      <a
                        href={a.link}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center gap-1.5 mt-2.5 text-sm font-semibold hover:underline ${coachAnswer ? 'text-honeycomb' : 'text-atlantic-navy'}`}
                      >
                        🎥 Watch / view resource →
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Answer form */}
          {!q.is_resolved && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-denim uppercase tracking-widest">
                {isCoach ? 'Your answer' : 'Add an answer'}
              </p>
              <textarea
                rows={3}
                value={af.body}
                onChange={e => onSetAnswerField(q.id, 'body', e.target.value)}
                className="input-field resize-none text-sm"
                placeholder={
                  isCoach
                    ? 'Type your answer — or just drop a link below.'
                    : 'Share what you know or how you solved this…'
                }
              />
              <input
                type="url"
                value={af.link}
                onChange={e => onSetAnswerField(q.id, 'link', e.target.value)}
                className="input-field text-sm"
                placeholder="Optional: video or resource link (https://…)"
              />
              <Button
                disabled={postingAnswer === q.id || (!af.body?.trim() && !af.link?.trim())}
                onClick={() => onPostAnswer(q.id)}
                className="px-4 py-2 text-sm"
              >
                {postingAnswer === q.id ? 'Posting…' : 'Post answer'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function QandA() {
  const { profile } = useAuth()
  const isCoach = profile?.role === 'coach'

  const [cohortId, setCohortId]         = useState('')
  const [cohorts, setCohorts]           = useState([])
  const [questions, setQuestions]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [loadError, setLoadError]       = useState('')
  const [expanded, setExpanded]         = useState(null)
  const [showAskForm, setShowAskForm]   = useState(false)
  const [newBody, setNewBody]           = useState('')
  const [posting, setPosting]           = useState(false)
  const [postError, setPostError]       = useState('')
  const [answerForms, setAnswerForms]   = useState({})
  const [postingAnswer, setPostingAnswer] = useState(null)

  useEffect(() => {
    if (!profile) return
    if (isCoach) {
      supabase.from('cohorts').select('id, name').order('created_at', { ascending: false })
        .then(({ data }) => {
          setCohorts(data || [])
          if (data?.length) setCohortId(data[0].id)
        })
    } else {
      supabase.from('students').select('cohort_id').eq('profile_id', profile.id).single()
        .then(({ data }) => { if (data) setCohortId(data.cohort_id) })
    }
  }, [profile])

  useEffect(() => { if (cohortId) load() }, [cohortId])

  async function load() {
    setLoading(true)
    setLoadError('')
    const { data, error } = await supabase
      .from('questions')
      .select(`
        *,
        profiles:author_id(full_name, role),
        question_answers(id, body, link, created_at, profiles:author_id(full_name, role)),
        question_votes(profile_id)
      `)
      .eq('cohort_id', cohortId)
      .order('created_at', { ascending: false })

    if (error) {
      setLoadError(error.message)
      setLoading(false)
      return
    }

    const sorted = (data || []).sort((a, b) => {
      if (a.is_resolved !== b.is_resolved) return a.is_resolved ? 1 : -1
      return (b.question_votes?.length || 0) - (a.question_votes?.length || 0)
    })
    setQuestions(sorted)
    setLoading(false)
  }

  async function postQuestion(e) {
    e.preventDefault()
    if (!newBody.trim()) return
    setPosting(true)
    setPostError('')
    const { error } = await supabase.from('questions').insert({
      cohort_id: cohortId,
      author_id: profile.id,
      body:      newBody.trim(),
    })
    if (error) { setPostError(error.message); setPosting(false); return }
    setNewBody('')
    setShowAskForm(false)
    setPosting(false)
    await load()
  }

  async function toggleVote(q) {
    const hasVoted = q.question_votes?.some(v => v.profile_id === profile.id)
    if (hasVoted) {
      await supabase.from('question_votes').delete()
        .eq('question_id', q.id).eq('profile_id', profile.id)
    } else {
      await supabase.from('question_votes').insert({ question_id: q.id, profile_id: profile.id })
    }
    await load()
  }

  async function postAnswer(questionId) {
    const form = answerForms[questionId] || {}
    if (!form.body?.trim() && !form.link?.trim()) return
    setPostingAnswer(questionId)
    await supabase.from('question_answers').insert({
      question_id: questionId,
      author_id:   profile.id,
      body:        form.body?.trim() || null,
      link:        form.link?.trim() || null,
    })
    setAnswerForms(prev => ({ ...prev, [questionId]: { body: '', link: '' } }))
    setPostingAnswer(null)
    await load()
  }

  async function toggleResolved(q) {
    await supabase.from('questions').update({ is_resolved: !q.is_resolved }).eq('id', q.id)
    await load()
  }

  function setAnswerField(qId, field, value) {
    setAnswerForms(prev => ({
      ...prev,
      [qId]: { ...(prev[qId] || { body: '', link: '' }), [field]: value },
    }))
  }

  const open     = questions.filter(q => !q.is_resolved)
  const resolved = questions.filter(q =>  q.is_resolved)

  const blockProps = {
    profile, isCoach, expanded, setExpanded,
    answerForms, postingAnswer,
    onVote: toggleVote,
    onPostAnswer: postAnswer,
    onToggleResolved: toggleResolved,
    onSetAnswerField: setAnswerField,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          {isCoach && <p className="eyebrow">Coach</p>}
          <h1 className="font-display text-3xl font-bold text-atlantic-navy mt-1">Q&amp;A</h1>
          <p className="text-denim mt-1">
            {isCoach
              ? 'Answer student questions with text or a video link. 🔥 means multiple people asked it.'
              : 'Ask questions between sessions. Upvote if you have the same question.'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {isCoach && cohorts.length > 0 && (
            <select value={cohortId} onChange={e => setCohortId(e.target.value)} className="input-field text-sm">
              {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          {!showAskForm && (
            <Button onClick={() => setShowAskForm(true)}>Ask a question</Button>
          )}
        </div>
      </div>

      {/* New question form */}
      {showAskForm && (
        <Card>
          <h2 className="font-bold text-atlantic-navy mb-3 text-lg">Your question</h2>
          <form onSubmit={postQuestion} className="space-y-3">
            <textarea
              autoFocus
              rows={4}
              value={newBody}
              onChange={e => setNewBody(e.target.value)}
              className="input-field resize-none"
              placeholder="What do you want to know? Be specific — others might have the same question."
              maxLength={1000}
            />
            <p className="text-xs text-denim text-right">{newBody.length}/1000</p>
            {postError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{postError}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={posting || !newBody.trim()}>
                {posting ? 'Posting…' : 'Post question'}
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => { setShowAskForm(false); setNewBody('') }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Question list */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
      ) : loadError ? (
        <Card>
          <p className="text-red-600 font-semibold mb-1">Couldn't load questions</p>
          <p className="text-sm text-denim">{loadError}</p>
          <p className="text-xs text-denim mt-2">Make sure you've run <code className="bg-powder px-1 rounded">supabase/qa.sql</code> in the Supabase SQL Editor.</p>
        </Card>
      ) : questions.length === 0 ? (
        <Card>
          <p className="text-denim text-base">No questions yet — be the first to ask one!</p>
        </Card>
      ) : (
        <div className="space-y-10">
          {open.length > 0 && (
            <section>
              {resolved.length > 0 && <p className="eyebrow mb-3">Open</p>}
              <div className="space-y-3">
                {open.map(q => <QuestionBlock key={q.id} q={q} {...blockProps} />)}
              </div>
            </section>
          )}
          {resolved.length > 0 && (
            <section>
              <p className="eyebrow mb-3">Resolved</p>
              <div className="space-y-3">
                {resolved.map(q => <QuestionBlock key={q.id} q={q} {...blockProps} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
