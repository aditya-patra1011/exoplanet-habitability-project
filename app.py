import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go

st.set_page_config(page_title="Exoplanet Candidate & Habitability Dashboard", layout="wide")

CHART_HEIGHT = 380
PLOTLY_TEMPLATE = "plotly_dark"

# --------- Data Loading -------------
@st.cache_data
def load_data():
    koi_labeled = pd.read_csv("data/processed/koi_labeled.csv")
    candidates_pred = pd.read_csv("data/processed/koi_candidates_predicted.csv")
    model_results = pd.read_csv("data/processed/phase3_model_results.csv")
    habitability = pd.read_csv("data/processed/habitatbility_scores.csv")
    rocky_hz = pd.read_csv("data/processed/rocky_habitable_zone_planets.csv")
    return koi_labeled, candidates_pred, model_results, habitability, rocky_hz

koi_labeled, candidates_pred, model_results, habitability, rocky_hz = load_data()

# ---------- Sidebar Navigation ---------------
st.sidebar.title("Navigation")
page = st.sidebar.radio(
    "Go to",
    ["Overview", "Part A: Candidate Classification", "Ablation Study", "Part B: Habitability Scoring", "Top Habitable Candidates"]
)

# ----------- Overview Page --------------
if page == "Overview":
    st.title("Exoplanet Candidate Classification & Habitabilty Analysis")
    st.markdown("""
    - **Part A**: Classifying KOI CANDIDATE rows as likely planets or false positives, across six models and three feature tiers.
    - **Part B**: Habitable-zone (HZ) status and Earth Similarity Index (ESI) for confirmed + predicted-real planets.
    """)

    st.markdown("---")
    st.subheader("Explore the Raw Data")

    numeric_cols = koi_labeled.select_dtypes(include=[np.number]).columns.tolist()
    exclude_from_selectors = ["target", "kepid"]
    selectable_cols = [c for c in numeric_cols if c not in exclude_from_selectors]

    disposition_map = koi_labeled["target"].map({0: "False Positive", 1: "Confirmed"})
    koi_labeled_display = koi_labeled.copy()
    koi_labeled_display["Disposition"] = disposition_map

    c1, c2 = st.columns([1, 1.4])

    with c1:
        st.markdown("**Feature Distribution**")
        hist_feature = st.selectbox(
            "Choose a feature for the histogram", selectable_cols,
            index = selectable_cols.index("koi_period") if "koi_period" in selectable_cols else 0 
        )
        fig_hist = px.histogram(
            koi_labeled_display, x=hist_feature, color="Disposition",
            color_discrete_map={"False Positive": "#d62728", "Confirmed": "#2ca02c"},
            template=PLOTLY_TEMPLATE, barmode="overlay", opacity=0.7, nbins=50
        )
        fig_hist.update_layout(height=CHART_HEIGHT)
        st.plotly_chart(fig_hist, use_container_width=True)
    with c2:
        st.markdown("**Disposition Markdown**")
        disp_counts = koi_labeled_display["Disposition"].value_counts().reset_index()
        disp_counts.columns = ["Disposition", "count"]
        fig_pie = px.pie(
            disp_counts, names="Disposition", values="count",
            color="Disposition",
            color_discrete_map={"False Positive": "#d62728", "Confirmed": "#2ca02c"},
            template=PLOTLY_TEMPLATE, hole=0.4
        )
        fig_pie.update_layout(height=CHART_HEIGHT)
        st.plotly_chart(fig_pie, use_container_width=True)

    st.markdown("**Feature Relationship Scatter Plot**")

    sc1, sc2 = st.columns(2)
    with sc1:
        x_axis = st.selectbox(
            "X axis", selectable_cols,
            index=selectable_cols.index("koi_period") if "koi_period" in selectable_cols else 0
        )
    with sc2:
        y_axis = st.selectbox(
            "Y", selectable_cols,
            index=selectable_cols.index("koi_prad") if "koi_prad" in selectable_cols else 1
        )

    x_min, x_max = float(koi_labeled[x_axis].min()), float(koi_labeled[x_axis].max())
    y_min, y_max = float(koi_labeled[y_axis].min()), float(koi_labeled[y_axis].max())

    sr1, sr2 = st.columns(2)
    with sr1:
        x_range = st.slider(f"{x_axis} range", x_min, x_max, (x_min, x_max))
    with sr2:
        y_range = st.slider(f"{y_axis} range", y_min, y_max, (y_min, y_max))

    scatter_data = koi_labeled_display[
        (koi_labeled_display[x_axis] >= x_range[0]) & (koi_labeled_display[x_axis] <= x_range[1]) &
        (koi_labeled_display[y_axis] >= y_range[0]) & (koi_labeled_display[y_axis] <= y_range[1])
    ]
    fig_scatter = px.scatter(
        scatter_data, x=x_axis, y=y_axis, color="Disposition",
        color_discrete_map={"False Positive": "#d62728", "Confirmed": "#2ca02c"},
        template=PLOTLY_TEMPLATE, opacity=0.6,
        hover_data=["kepid"] if "kepid" in scatter_data.columns else None
    )
    fig_scatter.update_layout(height=CHART_HEIGHT + 100)
    st.plotly_chart(fig_scatter, use_container_width=True)
    st.caption(f"Showing {len(scatter_data):,} of {len(koi_labeled):,} labeled rows within the selected ranges")

    st.markdown("---")
    st.subheader("Key Metrics")

    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Total KOI Rows", "9,564")
    col2.metric("Labeled (Confirmed + FP)", f"{len(koi_labeled):,}")
    col3.metric("Candiates Evaluated:", f"{len(candidates_pred):,}")
    col4.metric("Predicted Real", f"{(candidates_pred['predicted_real'] == 1).sum():,}")

    col5, col6, col7 = st.columns(3)
    hz_count = habitability["hz_status"].isin(["conservative_hz", "optimistic_hz"]).sum()
    conservative_pct = (habitability["hz_status"] == "conservative_hz").mean() * 100
    col5.metric("Planets Evaluated", f"{len(habitability):,}")
    col6.metric("In HZ (Conservative or Optimistic)", f"{hz_count:,}")
    col7.metric("Conservative HZ Rate", f"{conservative_pct:.2f}%")

# ------------ Part A Page -------------------------
elif page == "Part A: Candidate Classification":
    st.title("Part A: Candidate Classification")

    c1, c2 = st.columns(2)

    with c1:
        st.subheader("Target Distribution")
        target_counts = koi_labeled["target"].value_counts().rename({0: "False Positives", 1: "Confirmed"})
        fig = px.bar(
            x=target_counts.index, y=target_counts.values,
            color=target_counts.index,
            color_discrete_map={"False Positives": "#d62728", "Confirmed": "#2ca02c"},
            labels={"F1_mean": "F1 Score"}, range_x=[0.9, 1.0]
        )
        fig.update_layout(height=CHART_HEIGHT, showlegend=False)
        st.plotly_chart(fig, use_container_width=True)

    with c2:
        st.subheader("Full-Tier Model F1 Comparison")
        full_tier = model_results[model_results["Tier"] == "Full"].sort_values("F1_mean", ascending=True)
        fig2 = px.bar(
            full_tier, x="F1_mean", y="Model", orientation="h",
            error_x="F1_std", template=PLOTLY_TEMPLATE,
            labels={"F1_mean": "F1 Score"}, range_x=[0.9, 1.0]
        )
        fig2.update_layout(height=CHART_HEIGHT)
        st.plotly_chart(fig2, use_container_width=True)

    st.subheader("Candidate Predictions")
    prob_threshold = st.slider("Minimum predicted-real probability", 0.0, 1.0, 0.5, 0.05)
    filtered = candidates_pred[candidates_pred["predicted_real_probability"] >= prob_threshold]
    st.write(f"{len(filtered):,} CANDIDATE rows meet this threshold")
    st.dataframe(
        filtered[["kepid", "predicted_real_probability", "predicted_real"]]
        .sort_values("predicted_real_probability", ascending=False).head(50),
        use_container_width=True
    )

# ------------- Ablation Study Page ----------
elif page == "Ablation Study":
    st.title("Feature Tier Ablation Study")
    st.markdown("Comparing **Full**, **No-score**, and **Raw Physical** feature tiers to isolate how much accuracy comes from NASA's vetting-pipeline outputs (`koi_score`,`koi_fpflag_*`) versus raw physical measurements.")

    pivot = model_results.pivot_table(index="Model", columns="Tier", values="F1_mean", aggfunc="mean")
    pivot["Full_minus_RawPhysical"] = pivot["Full"] - pivot["Raw physical"]
    pivot = pivot.sort_values("Full_minus_RawPhysical", ascending=False)

    c1, c2 = st.columns([1, 1.3])
    with c1:
        st.subheader("F1 by tier (table)")
        st.dataframe(pivot.style.format("{:.4f}"), use_container_width=True)

    with c2:
        st.subheader("F1 Score Across Tiers")
        tier_order = ["Full", "No-Score", "Raw physical"]
        plot_df = model_results[model_results["Tier"].isin(tier_order)]
        fig3 = px.bar(
            plot_df, x="Model", y="F1_mean", color="Tier",
            category_orders={"Tier": tier_order}, barmode="group",
            template=PLOTLY_TEMPLATE, range_y=[0.9, 1.0]
        )
        fig3.update_layout(height=CHART_HEIGHT, xaxis_tickangle=-30)
        st.plotly_chart(fig3, use_container_width=True)

    st.markdown("""
    **Finding**: Tree-based models lose 2.0-2.5 F1 points moving Full -> Raw Physical; linear/kernel/neural
    models lose 4.4-4.5 points. Raw physical features alone still yield F1 0.92-0.97, confirming real physical
    signal independent of the vetting pipeline.
    """)

# ------------ Part B --------------
elif page == "Part B: Habitability Scoring":
    st.title("Part B: Habitability Scoring")

    c1, c2 = st.columns(2)

    with c1:
        st.subheader("HZ Status Distribution")
        hz_counts = habitability["hz_status"].value_counts().reset_index()
        hz_counts.columns = ["hz_status", "count"]
        fig4 = px.pie(
            hz_counts, names="hz_status", values="count",
            color="hz_status",
            color_discrete_map={"outside_hz": "#444444", "conservative_hz": "#2ca02c", "optimistic_hz": "#ff7f0e", "unknown": "#888888"},
            template=PLOTLY_TEMPLATE
        )
        fig4.update_layout(height=CHART_HEIGHT)
        st.plotly_chart(fig4, use_container_width=True)

    with c2:
        st.subheader("Habitability Rate by Score")
        source_summary = habitability.groupby("source").agg(
            total=("planet_name", "count"),
            in_conservative_hz=("hz_status", lambda x: (x == "conservative_hz").sum()),
            in_optimistic_hz = ("hz_status", lambda x: (x == "optimistic_hz").sum()),
            rocky_count=("likely_rocky", "sum")
        )
        source_summary["pct_conservative_hz"] = (source_summary["in_conservative_hz"] / source_summary["total"] * 100).round(2)
        st.dataframe(source_summary, use_container_width=True)

    st.subheader("Insolation Flux vs. Equilibrium Temperature")
    fig5 = px.scatter(
        habitability, x="insolation_flux", y="eq_temp_k", color="hz_status",
        color_discrete_map={"outisde_hz": "#555555", "conservative_hz": "#2ca02c", "optimistic_hz": "#ff7f0e", "unknown": "#888888"},
        hover_data=["planet_name", "radius_earth"],
        template=PLOTLY_TEMPLATE, range_x=[0, 3]
    )
    fig5.add_vline(x=1.0, line_dash="dash", line_color="white", opacity=0.5)
    fig5.add_hline(y=288, line_dash="dash", line_color="white", opacity=0.5)
    fig5.add_annotation(x=1.0, y=288, text="Earth", showarrow=True, arrowhead=2)
    fig5.update_layout(height=CHART_HEIGHT + 100)
    st.plotly_chart(fig5, use_container_width=True)

# ------------------ Top Candidates Page -------------------
elif page == "Top Habitable Candidates":
    st.title("Top Habitable Candidates by ESI")

    n = st.slider("Number of top candidates to show", 5, 50, 20)
    top_esi = habitability.dropna(subset=["esi_score"]).sort_values("esi_score", ascending=False).head(n)

    st.dataframe(
        top_esi[["planet_name", "source", "radius_earth", "eq_temp_k", "insolation_flux", "hz_status", "esi_score"]]
        .style.format({"radius_earth": "{:.3f}", "eq_temp_k": "{:.1f}", "insolation_flux": "{:.3f}", "esi_score": "{:.4f}"}),
        use_container_width=True
    )

    fig6 = px.scatter(
        top_esi, x="radius_earth", y="eq_temp_k", color="esi_score",
        text="planet_name", color_continuous_scale="Viridis",
        template=PLOTLY_TEMPLATE
    )
    fig6.update_traces(textposition="top center", marker=dict(size=12, line=dict(width=1, color="white")))
    fig6.add_vline(x=1.0, line_dash="dash", line_color="gray", opacity=0.5)
    fig6.add_hline(y=288, line_dash="dash", line_color="gray", opacity=0.5)
    fig6.update_layout(height=CHART_HEIGHT + 120)
    st.plotly_chart(fig6, use_container_width=True)

    st.subheader("Rocky + Habitable Zone Planets (Full List)")
    st.dataframe(
        rocky_hz[["planet_name", "source", "insolation_flux", "eq_temp_k", "radius_earth", "hz_status"]],
        use_container_width=True
    )