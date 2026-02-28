import { Container, Typography, Paper, Stack, Box, Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

const Help = () => {
  const faqs = [
    {
      question: 'How do I get started?',
      answer: 'Go to the Home page, enter a GitHub repository URL (e.g., https://github.com/psf/requests), and click "Summarize". You\'ll need an API key from one of the supported LLM providers. Visit Settings to configure your preferred provider and API key.',
    },
    {
      question: 'Which repositories can I analyze?',
      answer: 'You can analyze any public GitHub repository. Private repositories are not supported due to API access restrictions. If you encounter a "not found" error, please verify the repository is public.',
    },
    {
      question: 'How do I get an API key?',
      answer: 'Visit the Settings page. Each provider card has a "Get API Key" button that will take you to the sign-up page. Nebius Token Factory offers a free $1 credit for testing. Other providers offer free trials or pay-as-you-go pricing.',
    },
    {
      question: 'What if I don\'t see results?',
      answer: 'Make sure your API key is entered correctly in the Settings page and the provider is marked as "Active". Check the Logs panel (at the bottom) for error messages. If you see a rate limit error, wait a few moments and try again.',
    },
    {
      question: 'Is my data stored?',
      answer: 'All your data is stored locally in your browser using localStorage. Your API keys are never sent to our servers—they\'re only used to communicate directly with your chosen LLM provider. Search history is stored locally and can be exported as CSV.',
    },
    {
      question: 'Can I use my own API key?',
      answer: 'Yes! The app supports multiple LLM providers. Go to Settings, select your preferred provider, enter your API key, and click "Save Settings". The app will use your key for all subsequent requests.',
    },
    {
      question: 'Why is the summary incomplete or inaccurate?',
      answer: 'The summary quality depends on the repository structure and the LLM model used. Very large repositories may have limited file content due to context window limits. The app prioritizes README, configuration files, and main source files. Try different providers to compare results.',
    },
    {
      question: 'How do I export my search history?',
      answer: 'Go to the Home page. In the "Search History" section, click the "Export CSV" button. This will download a CSV file containing all your searches with URLs, summaries, technologies, and timestamps.',
    },
    {
      question: 'Can I view the logs?',
      answer: 'Yes! A log panel appears at the bottom of every page. You can filter logs by level (DEBUG, INFO, WARNING, ERROR), clear all logs, or export logs as JSON. Click "Collapse" to minimize the panel.',
    },
    {
      question: 'What\'s the rate limit?',
      answer: 'Each LLM provider has its own rate limits. Nebius Token Factory is generous for free tier users. GitHub\'s API has a 60 requests/hour limit for unauthenticated requests. If you hit a rate limit, wait a moment and try again.',
    },
  ]

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" sx={{ mb: 4, fontWeight: 600 }}>
        Help & FAQ
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          {faqs.map((faq, idx) => (
            <Accordion key={idx}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="textSecondary">
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, mt: 4, backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
        <Stack spacing={2}>
          <Typography variant="h5">Need more help?</Typography>
          <Typography variant="body2" color="textSecondary">
            Check the GitHub repository for detailed documentation, or open an issue if you encounter any problems.
          </Typography>
        </Stack>
      </Paper>
    </Container>
  )
}

export default Help
