import { Container, Typography, Paper, Stack, Chip, Link, Box } from '@mui/material'

const About = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" sx={{ mb: 4, fontWeight: 600 }}>
        About GitHub Repository Summarizer
      </Typography>

      <Paper sx={{ p: 4, mb: 3 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>
              What is this?
            </Typography>
            <Typography variant="body1" color="textSecondary">
              GitHub Repository Summarizer is a web application that uses Large Language Models (LLMs) to analyze GitHub repositories and generate human-readable summaries. Simply provide a repository URL, and the application will fetch the repository structure and key files, then use AI to produce a summary describing what the project does, what technologies it uses, and how it's organized.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>
              How does it work?
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              1. <strong>URL Input</strong>: You provide a public GitHub repository URL.
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              2. <strong>Smart File Selection</strong>: The application fetches the repository structure and intelligently selects the most important files (README, configuration files, main source files).
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              3. <strong>LLM Analysis</strong>: The selected files are sent to your chosen LLM provider (Nebius, OpenAI, Claude, etc.).
            </Typography>
            <Typography variant="body1" color="textSecondary">
              4. <strong>Structured Output</strong>: The LLM generates a summary, list of technologies, and project structure description.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Supported Technologies
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {['Python', 'JavaScript', 'React', 'FastAPI', 'Material-UI', 'GitHub API', 'Cloud AI APIs'].map(tech => (
                <Chip key={tech} label={tech} variant="outlined" />
              ))}
            </Stack>
          </Box>

          <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Supported LLM Providers
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              Choose your preferred AI provider:
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2">
                • <strong>Nebius Token Factory</strong> - Free $1 credit (recommended for testing)
              </Typography>
              <Typography variant="body2">
                • <strong>OpenAI</strong> - GPT-4, GPT-4 Turbo
              </Typography>
              <Typography variant="body2">
                • <strong>Anthropic</strong> - Claude family
              </Typography>
              <Typography variant="body2">
                • <strong>Google Gemini</strong> - Latest Gemini models
              </Typography>
              <Typography variant="body2">
                • <strong>Perplexity</strong> - Sonar model
              </Typography>
            </Stack>
          </Box>

          <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Privacy & Security
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Your search history is stored locally in your browser. API keys are stored securely in browser localStorage and are only sent to your selected LLM provider. We do not store any of your data on our servers.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>
              About the Project
            </Typography>
            <Typography variant="body1" color="textSecondary">
              This is a submission to the{' '}
              <Link href="https://academy.nebius.com/" target="_blank" rel="noopener">
                Nebius Academy
              </Link>
              {' '}admission assignment. The project demonstrates integration with multiple LLM providers, smart repository analysis, and responsive web design.
            </Typography>
          </Box>

          <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Source Code
            </Typography>
            <Typography variant="body1">
              <Link
                href="https://github.com/ikrigel/nebius-admission-assignment"
                target="_blank"
                rel="noopener"
              >
                View on GitHub
              </Link>
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Container>
  )
}

export default About
