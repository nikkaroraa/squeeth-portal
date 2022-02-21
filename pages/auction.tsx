import { Grid, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { NextPage } from 'next'
import Head from 'next/head'
import * as React from 'react'
import { formatDistance, format } from 'date-fns'
import { Nav } from '../container/Nav'
import PageGrid from '../container/PageGrid'
import useCrab from '../hooks/useCrab'
import useCrabStore from '../store/crabStore'
import { divideWithPrecision, formatBigNumber } from '../utils/math'
import useOracle from '../hooks/useOracle'
import { OSQUEETH, SQUEETH_UNI_POOL, WETH } from '../constants/address'
import { BIG_ZERO } from '../constants/numbers'
import { bnComparator } from '../utils'

const Auction: NextPage = () => {
  const { crabLoaded } = useCrab()

  return (
    <div>
      <Head>
        <title>Squeeth Strategy Auction</title>
      </Head>
      <Nav />
      <Box flexGrow={1} px={4} pt={4}>
        {!crabLoaded ? (
          <Typography variant="h3" color="primary" fontFamily="Cattyla" align="center">
            Loading...
          </Typography>
        ) : (
          <CrabAuction />
        )}
      </Box>
    </div>
  )
}

const CrabAuction = React.memo(function CrabAuction() {
  const { crabContract } = useCrab()
  const oracle = useOracle()
  const timeAtLastHedge = useCrabStore(s => s.timeAtLastHedge)
  const priceAtLastHedge = useCrabStore(s => s.priceAtLastHedge, bnComparator)
  const timeHedgeThreshold = useCrabStore(s => s.hedgeTimeThreshold)

  const [priceDeviation, setPriceDeviation] = React.useState(0)
  const [squeethPrice, setSqueethPrice] = React.useState(BIG_ZERO)

  React.useEffect(() => {
    oracle.getTwap(SQUEETH_UNI_POOL, OSQUEETH, WETH, 1, true).then(_squeethPrice => {
      const _deviation = ((divideWithPrecision(_squeethPrice, priceAtLastHedge, 4) - 1) * 100).toFixed(2)
      setSqueethPrice(_squeethPrice)
      setPriceDeviation(Number(_deviation))
    })
  }, [oracle, priceAtLastHedge])

  return (
    <PageGrid>
      <Typography variant="h6" color="primary" mb={2}>
        Crab Strategy auction
      </Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Box sx={{ height: '100%' }} bgcolor="background.surface" borderRadius={2} py={2} px={4}>
            <Typography textAlign="center" variant="h6" mb={2}>
              Previous auction
            </Typography>
            <Typography>
              Hedged time: {formatDistance(timeAtLastHedge * 1000, Date.now(), { addSuffix: true })}
            </Typography>
            <Typography>oSQTH Price: {formatBigNumber(priceAtLastHedge, 18, 6)} ETH</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ height: '100%' }} bgcolor="background.surface" borderRadius={2} py={2} px={4}>
            <Typography textAlign="center" variant="h6" mb={2}>
              Upcoming auction
            </Typography>
            <Typography>
              Next auction time: {format((timeAtLastHedge + timeHedgeThreshold) * 1000, 'dd-MMM-yyy hh:mm aa')}
            </Typography>
            <Typography>
              Current oSQTH price: {formatBigNumber(squeethPrice, 18, 6)} ({priceDeviation}%)
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </PageGrid>
  )
})

export default Auction
