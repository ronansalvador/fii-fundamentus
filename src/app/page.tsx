'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import './style.css'

type FiiData = {
  [key: string]: string
}

const COLUNAS_EXIBIDAS = [
  'Papel',
  'Segmento',
  'Cotação',
  'Dividend Yield',
  'P/VP',
  'Valor de Mercado',
  'Liquidez',
]

export default function Home() {
  const [dados, setDados] = useState<FiiData[]>([])
  const [dadosFiltrados, setDadosFiltrados] = useState<FiiData[]>([])

  // Filtros
  const [dividendMin, setDividendMin] = useState(10)
  const [dividendMax, setDividendMax] = useState(16)
  const [pvpMin, setPvpMin] = useState(0.6)
  const [pvpMax, setPvpMax] = useState(0.95)
  const [valorMin, setValorMin] = useState(1000000000)
  const [liqMin, setLiqMin] = useState(1000000)

  // Ordenação
  const [sortBy, setSortBy] = useState<string>('Papel')
  const [sortAsc, setSortAsc] = useState<boolean>(true)

  // Resetar filtros
  const resetFiltros = () => {
    setDividendMin(0)
    setDividendMax(
      dados.reduce((maior, atual) => {
        const atualValor = parseFloat(
          atual['Dividend Yield'].replace('%', '').replace(',', '.'),
        )
        return atualValor > maior ? atualValor : maior
      }, 0),
    )
    setPvpMin(0)
    setPvpMax(
      dados.reduce((maior, atual) => {
        const valorAtual = parseFloat(atual['P/VP'].replace(',', '.'))
        return valorAtual > maior ? valorAtual : maior
      }, 0),
    )
    setValorMin(0)
    setLiqMin(0)
  }

  const filtrosBase = () => {
    setDividendMin(10)
    setDividendMax(16)
    setPvpMin(0.6)
    setPvpMax(0.95)
    setValorMin(1000000000)
    setLiqMin(1000000)
  }

  useEffect(() => {
    axios
      .get('/api/fiis')
      .then((res) => setDados(res.data))
      .catch((err) => console.error('Erro:', err))
  }, [])

  useEffect(() => {
    const filtrados = dados.filter((item) => {
      const dy = parseFloat(
        item['Dividend Yield']?.replace('%', '').replace(',', '.').trim() || '',
      )
      const pvp = parseFloat(item['P/VP']?.replace(',', '.').trim() || '')
      const valorMercado = parseInt(
        item['Valor de Mercado']?.replace(/\./g, '').trim() || '',
      )
      const liquidez = parseInt(
        item['Liquidez']?.replace(/\./g, '').trim() || '',
      )

      if (isNaN(dy) || dy < dividendMin || dy > dividendMax) return false
      if (isNaN(pvp) || pvp < pvpMin || pvp > pvpMax) return false
      if (isNaN(valorMercado) || valorMercado < valorMin) return false
      if (isNaN(liquidez) || liquidez < liqMin) return false

      return true
    })

    // Ordenação
    const ordenados = [...filtrados].sort((a, b) => {
      const valA = a[sortBy]
      const valB = b[sortBy]

      // Numérico
      if (
        [
          'Cotação',
          'Dividend Yield',
          'P/VP',
          'Valor de Mercado',
          'Liquidez',
        ].includes(sortBy)
      ) {
        const numA = parseFloat(
          valA
            .replace('%', '')
            .replace('R$', '')
            .replace(/\./g, '')
            .replace(',', '.')
            .trim(),
        )
        const numB = parseFloat(
          valB
            .replace('%', '')
            .replace('R$', '')
            .replace(/\./g, '')
            .replace(',', '.')
            .trim(),
        )

        if (isNaN(numA) || isNaN(numB)) return 0
        return sortAsc ? numA - numB : numB - numA
      }

      // Alfabético
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA)
    })

    setDadosFiltrados(ordenados)
  }, [
    dados,
    dividendMin,
    dividendMax,
    pvpMin,
    pvpMax,
    valorMin,
    liqMin,
    sortBy,
    sortAsc,
  ])

  function Loading() {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Carregando dados...</p>
      </div>
    )
  }

  if (dados.length === 0) return <Loading />

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortAsc(!sortAsc)
    } else {
      setSortBy(col)
      setSortAsc(true)
    }
  }

  return (
    <div className="container">
      <h1>FIIs - Fundamentus</h1>

      {/* Filtros */}
      <div className="filtros">
        <div>
          <strong>Dividend Yield (%)</strong>
          <input
            type="number"
            value={dividendMin}
            onChange={(e) => setDividendMin(Number(e.target.value))}
          />
          <input
            type="number"
            value={dividendMax}
            onChange={(e) => setDividendMax(Number(e.target.value))}
          />
        </div>

        <div>
          <strong>P/VP</strong>
          <input
            type="number"
            step="0.01"
            value={pvpMin}
            onChange={(e) => setPvpMin(Number(e.target.value))}
          />
          <input
            type="number"
            step="0.01"
            value={pvpMax}
            onChange={(e) => setPvpMax(Number(e.target.value))}
          />
        </div>

        <div>
          <strong>Valor de Mercado (mínimo)</strong>
          <input
            type="number"
            value={valorMin}
            onChange={(e) => setValorMin(Number(e.target.value))}
          />
        </div>

        <div>
          <strong>Liquidez (mínimo)</strong>
          <input
            type="number"
            value={liqMin}
            onChange={(e) => setLiqMin(Number(e.target.value))}
          />
        </div>

        <button onClick={resetFiltros}>Limpar Filtros</button>
        <button onClick={filtrosBase}>Aplicar Filtros Base</button>
      </div>

      <p>Total: {dadosFiltrados.length}</p>

      <table>
        <thead>
          <tr>
            {COLUNAS_EXIBIDAS.map((col) => (
              <th key={col} onClick={() => handleSort(col)}>
                {col} {sortBy === col ? (sortAsc ? '▲' : '▼') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dadosFiltrados.map((row, i) => (
            <tr key={i}>
              {COLUNAS_EXIBIDAS.map((col) => (
                <td key={col} data-label={col}>
                  {row[col]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
