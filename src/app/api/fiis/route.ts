import { NextResponse } from 'next/server'
import axios from 'axios'
import * as cheerio from 'cheerio'
import iconv from 'iconv-lite'

export async function GET(req: Request) {
  try {
    const response = await axios.get(
      'https://fundamentus.com.br/fii_resultado.php',
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        responseType: 'arraybuffer', // necessário para pegar o buffer puro
      },
    )

    // Converte o conteúdo para ISO-8859-1
    const decodedHtml = iconv.decode(Buffer.from(response.data), 'latin1')

    const $ = cheerio.load(decodedHtml)
    const tabela = $('table').first()
    const resultado: any[] = []

    const colunas: string[] = []
    tabela.find('thead tr th').each((_, el) => {
      colunas.push($(el).text().trim())
    })

    tabela.find('tbody tr').each((_, row) => {
      const linha: Record<string, string> = {}
      $(row)
        .find('td')
        .each((i, td) => {
          linha[colunas[i]] = $(td).text().trim()
        })
      resultado.push(linha)
    })

    return NextResponse.json(resultado)
  } catch (error) {
    return NextResponse.json(
      {
        message: 'error',
        error,
      },
      { status: 500 },
    )
  }
}
