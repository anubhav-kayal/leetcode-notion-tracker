console.log('LeetTrack: main-world script injected at', document.readyState)

type SubmissionResult =
  | 'Accepted'
  | 'Wrong Answer'
  | 'Time Limit Exceeded'
  | 'Memory Limit Exceeded'
  | 'Runtime Error'
  | 'Compile Error'

interface ParsedSubmission {
  result: SubmissionResult
  language: string
  runtime: string
  memory: string
  code: string
}

const statusCodeMap: Record<number, SubmissionResult> = {
  10: 'Accepted',
  11: 'Wrong Answer',
  12: 'Memory Limit Exceeded',
  13: 'Wrong Answer', // Output Limit Exceeded mapped to Wrong Answer
  14: 'Time Limit Exceeded',
  15: 'Runtime Error',
  20: 'Compile Error',
}

const statusMsgMap: Record<string, SubmissionResult> = {
  'Accepted': 'Accepted',
  'Wrong Answer': 'Wrong Answer',
  'Time Limit Exceeded': 'Time Limit Exceeded',
  'Memory Limit Exceeded': 'Memory Limit Exceeded',
  'Output Limit Exceeded': 'Wrong Answer',
  'Runtime Error': 'Runtime Error',
  'Compile Error': 'Compile Error',
}

let lastSubmittedCode = ''
let lastSubmittedLanguage = ''

const originalFetch = window.fetch

window.fetch = async function (...args: Parameters<typeof fetch>): Promise<Response> {
  const response = await originalFetch.apply(window, args)
  const arg0 = args[0]
  
  let url = ''
  if (typeof arg0 === 'string') {
    url = arg0
  } else if (arg0 instanceof URL) {
    url = arg0.href
  } else if (arg0 && typeof (arg0 as any).url === 'string') {
    url = (arg0 as any).url
  }

  try {
    const body = args[1] ? (args[1] as RequestInit).body : null

    // 1. Legacy Submit Endpoint
    if (url.includes('/submit/')) {
      if (typeof body === 'string') {
        try {
          const parsedBody = JSON.parse(body)
          if (parsedBody.typed_code) lastSubmittedCode = parsedBody.typed_code
          if (parsedBody.lang) lastSubmittedLanguage = parsedBody.lang
        } catch { /* ignore */ }
      }
    }

    // 2. Legacy Check Endpoint
    if (url.includes('/check/')) {
      const clone = response.clone()
      clone.json().then((data: any) => {
        if (!data || data.state !== 'SUCCESS') return
        const result = statusMsgMap[data.status_msg] || statusCodeMap[data.status_code]
        if (!result) return

        const parsed: ParsedSubmission = {
          result,
          language: data.lang || lastSubmittedLanguage || '',
          runtime: data.status_runtime || '',
          memory: data.memory || '',
          code: lastSubmittedCode || '',
        }
        window.postMessage({ type: 'LEETTRACK_FETCH_SUBMISSION', data: parsed }, '*')
      }).catch(() => {})
    }

    // 3. GraphQL Endpoints
    if (url.includes('/graphql')) {
      if (typeof body === 'string') {
        try {
          const parsedBody = JSON.parse(body)
          
          // Capture code from submitSolution just in case
          if (parsedBody.operationName === 'submitSolution') {
            if (parsedBody.variables?.typedCode) lastSubmittedCode = parsedBody.variables.typedCode
            if (parsedBody.variables?.lang) lastSubmittedLanguage = parsedBody.variables.lang
          }

          // Check for submissionDetails which returns the final result
          if (parsedBody.operationName === 'submissionDetails' || parsedBody.operationName === 'submission') {
            const clone = response.clone()
            clone.json().then((data: any) => {
              const details = data?.data?.submissionDetails || data?.data?.submission
              if (!details) return
              
              const result = statusCodeMap[details.statusCode]
              if (!result) return // Pending or Unknown

              const parsed: ParsedSubmission = {
                result,
                language: details.lang?.name || lastSubmittedLanguage || '',
                runtime: details.runtimeDisplay || '',
                memory: details.memoryDisplay || '',
                code: details.code || lastSubmittedCode || '',
              }
              window.postMessage({ type: 'LEETTRACK_FETCH_SUBMISSION', data: parsed }, '*')
            }).catch(() => {})
          }
        } catch { /* ignore */ }
      }
    }
  } catch { /* silent */ }

  return response
}
