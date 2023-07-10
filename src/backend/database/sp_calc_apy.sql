/* STORED PROCEDURE: SP_CALC_APY */

--  Generates the staking, interest and total APY
-- 
--  The staking and interest APY are calculated by:
--      (1) Retrieving the most recent and the latest epochs (within a 7 day timewindow).
--      (2) Extracting the earnings per epoch of nft #1# (reference) for those two intervals
--      (3) Calculate the base value and the comparison value for the yields
--          (3.1) Staking: take the recent value (latest staked XRD + recent staking rewards) and latest value (latest staked XRD + latest staking rewards)
--          (3.2) Interest: take the recent value (latest staking rewards + recent interest earnings) and latest value (latest staking rewards + latest interest earnings)
--      (4) Calculate the yield per considered timewindow 
--          (i.e. recent = 07-01-2023 and latest = 02-01-2023 => timewindow = 6 days)
--      (5) Extending the yield to annually by dividing 365 days with the timewindow
--          and subsequently multiplying the yield with it

CREATE OR REPLACE PROCEDURE insert_apy_data()
LANGUAGE plpgsql
AS $$
BEGIN
    WITH time_window AS (
        SELECT
            (SELECT MAX(timestamp) - INTERVAL '7 days' FROM user_info) AS start_time,
            (SELECT MAX(timestamp) FROM user_info) AS end_time
    )
    INSERT INTO apy_data (
        epoch,
        timestamp,
        staking_rewards_apy,
        interest_earnings_apy,
        total_earnings_apy
    )
    SELECT

        epoch,
        recent_timestamp AS timestamp,
        ((recent_staking_rewards_relative - latest_staking_rewards_relative) / latest_staking_rewards_relative)
            * (365 / EXTRACT(DAY FROM (recent_timestamp - latest_timestamp))) 
                AS staking_rewards_apy,

        ( POWER(1 + ((recent_interest_earnings_relative - latest_interest_earnings_relative)/ latest_interest_earnings_relative), 
            (365 / EXTRACT(DAY FROM (recent_timestamp - latest_timestamp))) - 1) - 1
                ) AS interest_earnings_ap,
                
        ( 1 + ((recent_staking_rewards_relative - latest_staking_rewards_relative) / latest_staking_rewards_relative)
                * (365 / EXTRACT(DAY FROM (recent_timestamp - latest_timestamp))))      
            * 
                ( 1 + ((recent_interest_earnings_relative - latest_interest_earnings_relative) / latest_interest_earnings_relative)
                        * (365 / EXTRACT(DAY FROM (recent_timestamp - latest_timestamp))))   
                    - 1 AS total_earnings_apy

    FROM (
        SELECT
            recent_entry.epoch,
            recent_entry.timestamp AS recent_timestamp,
            latest_entry.timestamp AS latest_timestamp,
            latest_entry.stake + recent_entry.staking_rewards  AS recent_staking_rewards_relative,
            latest_entry.staking_rewards + recent_entry.interest_earnings AS recent_interest_earnings_relative,
            latest_entry.stake + latest_entry.staking_rewards  AS latest_staking_rewards_relative,
            latest_entry.staking_rewards + latest_entry.interest_earnings AS latest_interest_earnings_relative
        FROM (
            SELECT
                ui.epoch,
                ui.timestamp AS timestamp,
                1000 AS stake,
                ui.lsu_amount AS lsu_amount,
                ui.staking_rewards AS staking_rewards,
                ui.interest_earnings AS interest_earnings
            FROM user_info ui
            JOIN time_window tw ON ui.timestamp >= tw.start_time AND ui.timestamp <= tw.end_time
            WHERE ui.nft_id = '#1#'
            ORDER BY ui.timestamp DESC
            LIMIT 1
        ) AS recent_entry
        CROSS JOIN (
            SELECT
                ui.epoch,
                ui.timestamp AS timestamp,
                1000 AS stake,
                ui.lsu_amount AS lsu_amount,
                ui.staking_rewards AS staking_rewards,
                ui.interest_earnings AS interest_earnings
            FROM user_info ui
            JOIN time_window tw ON ui.timestamp >= tw.start_time AND ui.timestamp <= tw.end_time
            WHERE ui.nft_id = '#1#'
            ORDER BY ui.timestamp ASC
            LIMIT 1
        ) AS latest_entry
    ) AS apy;
END;
$$;

----------

-- * DUMMY DATA *
-- Insert script for the apy_data table
INSERT INTO apy_data (epoch, timestamp, staking_rewards_apy, interest_earnings_apy, total_earnings_apy)
VALUES 
  (12046, '2023-07-12 12:56:41.831'::timestamp, 0.196872, 0.049700, ((1 + 0.196872) * (1 + 0.256357) - 1) * 1.01),
  (12047, '2023-07-15 12:56:41.831'::timestamp, 0.20284, 0.051161, ((1 + 0.20284) * (1 + 0.263706) - 1) * 1.02),
  (12048, '2023-07-18 12:56:41.831'::timestamp, 0.208875, 0.052664, ((1 + 0.208875) * (1 + 0.271217) - 1) * 1.03),
  (12049, '2023-07-21 12:56:41.831'::timestamp, 0.215, 0.054215, ((1 + 0.215) * (1 + 0.054215) - 1) * 1.04),
  (12050, '2023-07-24 12:56:41.831'::timestamp, 0.221215, 0.055819, ((1 + 0.221215) * (1 + 0.055819) - 1) * 1.05),
  (12051, '2023-07-27 12:56:41.831'::timestamp, 0.227524, 0.057478, ((1 + 0.227524) * (1 + 0.057478) - 1) * 1.06),
  (12052, '2023-07-30 12:56:41.831'::timestamp, 0.233928, 0.059194, ((1 + 0.233928) * (1 + 0.059194) - 1) * 1.07),
  (12053, '2023-08-02 12:56:41.831'::timestamp, 0.240431, 0.060970, ((1 + 0.240431) * (1 + 0.060970) - 1) * 1.08),
  (12054, '2023-08-05 12:56:41.831'::timestamp, 0.247036, 0.062808, ((1 + 0.247036) * (1 + 0.062808) - 1) * 1.09),
  (12055, '2023-08-08 12:56:41.831'::timestamp, 0.253745, 0.064709, ((1 + 0.253745) * (1 + 0.064709) - 1) * 1.10);

(1 + StakingAPY) * ( 1 + InterestAPY) - 1