"""Source-only guards for native category browsing and owner organization.

These checks do not compile Swift or replace MatterListPresentationTests/Simulator QA.
"""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FEATURES = ROOT / 'apps/ios/Rillora/Features'


class NativeMatterNavigationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.helper = (FEATURES / 'Matters/MatterListPresentation.swift').read_text()
        cls.matters = (FEATURES / 'Matters/MattersView.swift').read_text()
        cls.overview = (FEATURES / 'Overview/OverviewView.swift').read_text()
        cls.dashboard = (FEATURES / 'Overview/OverviewDashboardComponents.swift').read_text()

    def test_category_filter_contains_all_domain_categories(self):
        categories = re.search(r'static let categories: \[MatterCategory\] = \[(.*?)\]', self.helper, re.S)[1]
        self.assertEqual(re.findall(r'\.(\w+)', categories), [
            'account', 'document', 'device', 'financialAsset', 'debt', 'subscription', 'cryptoAsset',
        ])
        self.assertIn('matter.category == categoryID', self.helper)
        self.assertIn('categoryID: filter, query: searchText', self.matters)
        self.assertIn('MatterListPresentation.categories.map', self.matters)
        self.assertNotIn('isReady', self.matters)
        self.assertNotRegex(self.matters, r'id: "(?:review|added)"')

    def test_search_preserves_translated_categories_and_user_text(self):
        self.assertIn('categoryLabel: (MatterCategory) -> String = { $0.label }', self.helper)
        self.assertIn('MatterCategory(rawValue: matter.category).map(categoryLabel)', self.helper)
        self.assertIn('[matter.title, matter.institutionName ?? "", translatedCategory', self.helper)
        self.assertIn('localizedStandardContains(search)', self.helper)

    def test_empty_results_do_not_cover_filters_and_allow_category_reset(self):
        self.assertNotIn('.overlay {', self.matters)
        self.assertIn('matters.filter-empty', self.matters)
        self.assertIn('matters.search-empty', self.matters)
        self.assertIn('matters.filter-reset', self.matters)
        self.assertIn('Button(String(localized: "Show all categories")) { filter = "all" }', self.matters)

    def test_next_action_reuses_required_locator_definitions(self):
        self.assertIn('let draft = MatterDraft(matter: matter)', self.helper)
        self.assertIn('draft.requiresProvider', self.helper)
        self.assertIn('draft.category.requiresLocation', self.helper)
        self.assertIn('draft.category.detailFields(custody: draft.cryptoCustody) where field.required', self.helper)
        self.assertNotIn('isReady', self.helper)
        self.assertNotIn('desiredOutcome', self.helper)
        self.assertNotIn('trustedContacts', self.helper)

    def test_home_and_rows_use_neutral_presentation_without_changing_review_features(self):
        self.assertNotIn('snapshot.nextMatter', self.overview)
        self.assertNotIn('String(localized: "Review next matter")', self.overview)
        self.assertIn('onOpenMatter(nextAction.matter)', self.overview)
        self.assertIn('nextAction?.title ?? String(localized: "View your matters")', self.overview)
        self.assertIn('overview.review-next', self.overview)
        self.assertIn('MatterListPresentation.summaryMatters(snapshot.matters)', self.dashboard)
        self.assertIn('String(localized: "Your matters")', self.dashboard)
        self.assertIn('MatterListPresentation.ownerStatusLabel(for: matter)', self.dashboard)
        self.assertIn('MatterStatus.needsReview.rawValue', self.helper)
        self.assertIn('String(localized: "To organize")', self.helper)


if __name__ == '__main__':
    unittest.main()
